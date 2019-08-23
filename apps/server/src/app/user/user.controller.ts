import {
  Body,
  Controller,
  Delete,
  Get,
  HttpService,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from '@nestjs/common';
import { BaseController } from '../base.controller';
import { AuthGuard } from '@nestjs/passport';
import { IPerson, Person } from '../../../../../libs/ersdlib/src/lib/person';
import { AuthRequest } from '../auth-module/auth-request';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { IBundle } from '../../../../../libs/ersdlib/src/lib/bundle';
import { Subscription } from '../../../../../libs/ersdlib/src/lib/subscription';
import { IEmailRequest } from '../../../../../libs/ersdlib/src/lib/email-request';
import * as nodemailer from 'nodemailer';
import * as config from 'config';
import { IEmailConfig } from '../email-config';
import * as SMTPConnection from 'nodemailer/lib/smtp-connection';
import * as Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { InvalidModuleConfigException } from '@nestjs/common/decorators/modules/exceptions/invalid-module-config.exception';
import { IServerConfig } from '../server-config';
import { buildFhirUrl } from '../helper';

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

    this.logger.log('Getting all people registered in the FHIR server');
    const people = await this.getAllPeople(request);

    this.logger.log('Creating email transport to send emails');
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

    const filteredPeople = people.filter((person) => !!person.email);

    this.logger.log(`Sending email to ${filteredPeople.length} people`);

    const sendPromises = filteredPeople
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

    try {
      const sendResults = await Promise.all(sendPromises);

      sendResults.forEach((result) => {
        this.logger.log(`Successfully sent message with ID: ${result.messageId}`);
      });
    } catch (ex) {
      this.logger.error(`Error sending email to all registered users: ${ex.message}`);
      throw new InternalServerErrorException();
    }
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

    const results = await this.httpService.request<IBundle>({
      url: this.buildFhirUrl('Person', null, { identifier: identifierQuery }),
      headers: {
        'cache-control': 'no-cache'
      }
    }).toPromise();

    const peopleBundle = results.data;

    if (peopleBundle) {
      if (peopleBundle.total === 1) {
        this.logger.log(`Found a single person with identifier ${identifierQuery}`);
        return <Person>peopleBundle.entry[0].resource;
      } else if (peopleBundle.total === 0) {
        throw new NotFoundException();
      }
    }

    throw new InternalServerErrorException(`Did not find any people with identifier ${identifierQuery}`);
  }

  async enableSubscriptions(person: Person) {
    const maxNotifications = serverConfig.contactInfo ? serverConfig.contactInfo.maxNotifications : 0;

    // Subscriptions aren't enable, so we shouldn't turn the subscriptions on.
    if (!serverConfig.enableSubscriptions) {
      return;
    }

    // If the person hasn't had the maximum notifications sent out, then they're subscriptions aren't
    // going to be turned off...
    if (!person.lastExpirationSent || person.expirationSentCount !== maxNotifications) {
      return;
    }

    this.logger.log(`The person's account has expired. Checking their subscriptions to see if any should be re-activated`);

    const getSubscriptionsPromises = (person.extension || [])
      .filter((ext) => {
        return ext.url === Constants.extensions.subscription &&
          ext.valueReference &&
          ext.valueReference.reference &&
          ext.valueReference.reference.split('/').length === 2;
      })
      .map((ext) => {
        const split = ext.valueReference.reference.split('/');
        const subscriptionUrl = buildFhirUrl(serverConfig.fhirServerBase, 'Subscription', split[1]);
        return this.httpService.get<Subscription>(subscriptionUrl).toPromise();
      });

    const getSubscriptionsResults = await Promise.all(getSubscriptionsPromises);
    this.logger.log(`Found ${getSubscriptionsResults.length} subscriptions associated with the person`);
    const inactiveSubscriptions = getSubscriptionsResults.filter(result => result.data.status !== 'active');
    this.logger.log(`Re-activating ${inactiveSubscriptions.length} subscriptions for the person`);

    const updateSubscriptionPromises = inactiveSubscriptions
      .map((result) => {
        const subscription = result.data;
        subscription.status = 'requested';

        const subscriptionUrl = this.buildFhirUrl('Subscription', subscription.id);
        return this.httpService.put<Subscription>(subscriptionUrl, subscription).toPromise();
      });

    await Promise.all(updateSubscriptionPromises);
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
      this.logger.error(`Error when getting existing person: ${ex.message}`);
    }

    if (!existingPerson) {
      const newSubscriptionUrl = this.buildFhirUrl('Subscription');
      let newSubscriptionResults;
      let newSubscription = new Subscription();
      newSubscription.criteria = serverConfig.subscriptionCriteria;
      newSubscription.channel.type = 'email';
      newSubscription.channel.endpoint = 'mailto:' + updatePerson.email;
      newSubscription.channel.payload = 'application/xml';    // Default payload to JSON (for now)
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
    } else {
      // Ensure the person's subscriptions are enabled if they are not a new person
      await this.enableSubscriptions(existingPerson);
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

    this.logger.log(`Deleting person ${id}. Retrieving the Person resource to determine what all should be deleted.`);

    const url = this.buildFhirUrl('Person', id);

    const getResults = await this.httpService.get<Person>(url).toPromise();
    const person = getResults.data;

    const subscriptionExtensions = (person.extension || [])
      .filter((ext) => {
        return ext.url === Constants.extensions.subscription &&
          ext.valueReference &&
          ext.valueReference.reference &&
          ext.valueReference.reference.split('/').length === 2
      });

    this.logger.log(`Found ${subscriptionExtensions.length} subscriptions associated with person ${person.id}`);

    try {
      const deletePromises = subscriptionExtensions
        .map((ext) => {
          const split = ext.valueReference.reference.split('/');

          this.logger.log(`Deleting subscription ${split[1]} associated with person ${person.id}`);

          const subscriptionUrl = this.buildFhirUrl('Subscription', split[1]);
          return this.httpService.delete(subscriptionUrl).toPromise();
        });

      await Promise.all(deletePromises);

      this.logger.log(`Done deleting all subscriptions associated with person ${person.id}`);
    } catch (ex) {
      this.logger.error(`Error removing subscriptions for person ${person.id}: ${ex.message}`);
    }

    this.logger.log(`Deleting person ${person.id}`);

    await this.httpService.delete(url).toPromise();

    this.logger.log(`Done deleting person ${person.id}`);
  }
}
