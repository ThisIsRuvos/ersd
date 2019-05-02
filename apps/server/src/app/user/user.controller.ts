import { Body, Controller, Delete, Get, HttpService, InternalServerErrorException, Logger, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { BaseController } from '../base.controller';
import { AuthGuard } from '@nestjs/passport';
import { IPerson, Person } from '../../../../../libs/kdslib/src/lib/person';
import { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/kdslib/src/lib/constants';
import { IBundle } from '../../../../../libs/kdslib/src/lib/bundle';
import { Subscription } from '../../../../../libs/kdslib/src/lib/subscription';
import { IEmailRequest } from '../../../../../libs/kdslib/src/lib/email-request';
import * as nodemailer from 'nodemailer';
import * as config from 'config';
import { IEmailConfig } from '../email-config';
import * as SMTPConnection from 'nodemailer/lib/smtp-connection';
import * as Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { getErrorString } from '../../../../../libs/kdslib/src/lib/get-error-string';
import { InvalidModuleConfigException } from '@nestjs/common/decorators/modules/exceptions/invalid-module-config.exception';
import { identifier } from '@babel/types';
import { IServerConfig } from '../server-config';

const emailConfig = <IEmailConfig> config.get('email');
const serverConfig = <IServerConfig> config.get('server');

@Controller('user')
@UseGuards(AuthGuard())
export class UserController extends BaseController {
  private readonly logger = new Logger(UserController.name);

  constructor(private httpService: HttpService) {
    super();
  }

  @Post('email')
  async emailAllPeople(@Req() request: AuthRequest, @Body() body: IEmailRequest) {
    this.assertAdmin(request);

    if (!emailConfig.host || !emailConfig.port) {
      throw new InvalidModuleConfigException('Email has not been configured on this server');
    }

    const transportOptions: SMTPConnection.Options = {
      host: emailConfig.host,
      port: emailConfig.port,
      requireTLS: emailConfig.tls
    };

    if (emailConfig.username && emailConfig.password) {
      transportOptions.auth = {
        user: emailConfig.username,
        pass: emailConfig.password
      };
    }

    const people = await this.getAllPeople(request);
    const transporter = nodemailer.createTransport(transportOptions);

    const sendMessage = (options: Mail.Options) => {
      return new Promise<SentMessageInfo>((resolve, reject) => {
        transporter.sendMail(options, (err, info) => {
          if (err) {
            reject(err);
          } else {
            resolve(info);
          }
        });
      });
    };

    const sendPromises = people
      .filter((person) => !!person.email)
      .map((person) => {
        const mailMessage: Mail.Options = {
          from: emailConfig.from,
          to: person.email,
          subject: body.subject,
          text: body.message
        };
        return sendMessage(mailMessage);
      });

    this.logger.log(`Sending email to ${sendPromises.length} people`);

    const sendResults = await Promise.all(sendPromises);

    sendResults.forEach((result) => {
      this.logger.log(`Successfully sent message with ID: ${result.messageId}`);
    });
  }

  @Get()
  async getAllPeople(@Req() request: AuthRequest): Promise<Person[]> {
    this.assertAdmin(request);

    let people: Person[] = [];
    const getNext = (url?: string): Promise<void> => {
      if (!url) {
        url = this.buildFhirUrl('Person', null, { _summary: true });
      }

      return new Promise((resolve, reject) => {
        this.httpService.get<IBundle>(url).toPromise()
          .then((results) => {
            const bundle = results.data;

            if (bundle.entry) {
              const resources = bundle.entry.map((entry) => new Person(entry.resource));
              people = people.concat(resources);
            }

            if (bundle.link) {
              const foundNext = bundle.link.find((link) => link.relation === 'next');

              if (foundNext) {
                getNext(foundNext.url)
                  .then(() => resolve())
                  .catch((err) => reject(err));
              } else {
                resolve();
              }
            }
          });
      });
    };

    await getNext();    // get all people
    return people;
  }

  @Get('me')
  async getMyPerson(@Req() request: AuthRequest): Promise<Person> {
    const identifierQuery = Constants.keycloakSystem + '|' + request.user.sub;

    this.logger.log(`Searching for existing person with identifier ${identifierQuery}`);

    return this.httpService.request<IBundle>({
      url: this.buildFhirUrl('Person', null, { identifier: identifierQuery }),
      headers: {
        'cache-control': 'no-cache'
      }
    }).toPromise()
      .then((peopleBundle) => {
        if (peopleBundle.data && peopleBundle.data.total === 1) {
          this.logger.log(`Found a single person with identifier ${identifierQuery}`);
          return <Person> peopleBundle.data.entry[0].resource;
        }

        this.logger.log('Did not find any people with identifier ${identifierQuery}');
      });
  }

  @Post('me')
  async updateMyPerson(@Req() request: AuthRequest, @Body() body: Person): Promise<Person> {
    const updatePerson = new Person(body);
    updatePerson.identifier = updatePerson.identifier || [];

    let foundIdentifier = updatePerson.identifier.find((identifier) => identifier.system === Constants.keycloakSystem);

    if (!foundIdentifier) {
      foundIdentifier = {
        system: Constants.keycloakSystem,
        value: request.user.sub
      };
      updatePerson.identifier.push(foundIdentifier);
    }

    let existingPerson;

    try {
      existingPerson = await this.getMyPerson(request);
    } catch (ex) {
      this.logger.error(`Error when getting existing person: ${ex}`);
      throw new InternalServerErrorException(ex.message);
    }

    if (!existingPerson) {
      const newSubscriptionUrl = this.buildFhirUrl('Subscription');
      let newSubscriptionResults;
      let newSubscription = new Subscription();
      newSubscription.criteria = serverConfig.subscriptionCriteria;
      newSubscription.channel.type = 'email';
      newSubscription.channel.endpoint = 'mailto:' + updatePerson.email;
      newSubscription.status = serverConfig.enableSubscriptions ? 'requested' : 'off';

      this.logger.log(`Person does not already exist. Creating default subscriptions for new person via url: ${newSubscriptionUrl}`);

      try {
        newSubscriptionResults = await this.httpService.post<Subscription>(newSubscriptionUrl, newSubscription).toPromise();
      } catch (ex) {
        this.logger.error(`Error when creating default subscription for new user: ${ex}`);
        throw new InternalServerErrorException(ex.message);
      }

      newSubscription = new Subscription(newSubscriptionResults.data);

      this.logger.log(`Adding default subscription to Person resource`);

      updatePerson.extension = updatePerson.extension || [];
      updatePerson.extension.push({
        url: Constants.extensions.subscription,
        valueReference: {
          reference: 'Subscription/' + newSubscription.id
        }
      });
    }

    this.logger.log('Sending request to FHIR server to update the Person resource');

    let updatePersonRequest;

    try {
      updatePersonRequest = await this.httpService.request<Person>({
        method: existingPerson ? 'PUT' : 'POST',
        url: this.buildFhirUrl('Person', existingPerson ? existingPerson.id : ''),
        data: updatePerson
      }).toPromise();
    } catch (ex) {
      this.logger.error(`Error when updating Person resource on FHIR server: ${ex}`);
      throw new InternalServerErrorException(ex.message);
    }

    this.logger.log('Done updating person resource, responding with updated person');
    return updatePersonRequest.data;
  }

  @Get(':id')
  async getUser(@Req() request: AuthRequest, @Param('id') id: string): Promise<Person> {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    const results = await this.httpService.get<Person>(url).toPromise();
    return results.data;
  }

  @Put(':id')
  async updateUser(@Req() request: AuthRequest, @Param('id') id: string, @Body() body: Person) {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    await this.httpService.put<IPerson>(url, body).toPromise();
  }

  @Delete(':id')
  async deleteUser(@Req() request: AuthRequest, @Param('id') id: string) {
    this.assertAdmin(request);

    const url = this.buildFhirUrl('Person', id);
    await this.httpService.delete(url).toPromise();
  }
}
