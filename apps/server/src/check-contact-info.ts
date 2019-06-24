import {HttpService, Logger} from '@nestjs/common';
import {IServerConfigContactInfo} from './app/server-config';
import {buildFhirUrl} from './app/helper';
import {IBundle} from '../../../libs/kdslib/src/lib/bundle';
import {Person} from '../../../libs/kdslib/src/lib/person';
import {Constants} from '../../../libs/kdslib/src/lib/constants';
import {Subscription} from '../../../libs/kdslib/src/lib/subscription';
import {IEmailConfig} from './app/email-config';

import * as path from 'path';
import * as fs from 'fs';
import * as SMTPConnection from 'nodemailer/lib/smtp-connection';
import * as Mail from 'nodemailer/lib/mailer';
import * as nodemailer from 'nodemailer';
import moment from 'moment';    // this syntax is needed, for some reason

export class CheckContactInfo {
  static readonly logger = new Logger(CheckContactInfo.name);

  readonly httpService = new HttpService();
  readonly logger = new Logger(CheckContactInfo.name);
  readonly fhirServerBase: string;
  readonly contactInfoConfig: IServerConfigContactInfo;
  readonly emailConfig: IEmailConfig;
  readonly transporter: any;      // Not sure why "Mail" type can't be used here... TS complains.

  constructor(fhirServerBase: string, contactInfoConfig: IServerConfigContactInfo, emailConfig: IEmailConfig) {
    this.fhirServerBase = fhirServerBase;
    this.contactInfoConfig = contactInfoConfig;
    this.emailConfig = emailConfig;

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

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  private static prepareTemplate(content: string, params: { [key: string]: string }): string {
    const paramKeys = Object.keys(params);
    paramKeys.forEach((key) => {
      content = content.replace('{' + key + '}', params[key]);
    });
    return content;
  }

  private static async executeTimer(checker: CheckContactInfo, duration: number) {
    try {
      await checker.executeInternal();
    } catch (ex) {
      new Logger(CheckContactInfo.name).error(ex.message);
    }

    setTimeout(async () => {
      // Set the next interval (recursive)
      CheckContactInfo.executeTimer(checker, duration);
    }, duration * 1000);
  }

  static execute(fhirServerBase: string, contactInfoConfig: IServerConfigContactInfo, emailConfig: IEmailConfig) {
    const hasConfigurations =
      contactInfoConfig &&
      contactInfoConfig.checkDurationSeconds &&
      contactInfoConfig.checkCountPerPage > 0 &&
      contactInfoConfig.maxNotifications > 0 &&
      contactInfoConfig.templates &&
      contactInfoConfig.templates.expired &&
      contactInfoConfig.templates.expired.subject &&
      contactInfoConfig.templates.expired.text &&
      contactInfoConfig.templates.expired.html &&
      contactInfoConfig.templates.expiring.subject &&
      contactInfoConfig.templates.expiring.text &&
      contactInfoConfig.templates.expiring.html &&
      contactInfoConfig.expiration &&
      contactInfoConfig.expiration.value &&
      contactInfoConfig.expiration.unit &&
      contactInfoConfig.notificationInterval &&
      contactInfoConfig.notificationInterval.value &&
      contactInfoConfig.notificationInterval.unit &&
      emailConfig &&
      emailConfig.host &&
      emailConfig.port &&
      emailConfig.from;

    if (!hasConfigurations) {
      this.logger.error('Sever is not configured with necessary information to check contact information for expiration');
      return;
    }

    const checker = new CheckContactInfo(fhirServerBase, contactInfoConfig, emailConfig);
    CheckContactInfo.executeTimer(checker, contactInfoConfig.checkDurationSeconds);
  }

  private async getAllPeople(url?: string): Promise<IBundle> {
    if (!url) {
      const params = {};

      if (this.contactInfoConfig.checkCountPerPage) {
        params['_count'] = this.contactInfoConfig.checkCountPerPage;
      }

      url = buildFhirUrl(this.fhirServerBase, 'Person', null,  params);
    }

    let results;

    try {
      results = await this.httpService.get<IBundle>(url).toPromise();
    } catch (ex) {
      this.logger.error('Failed to retrieve people from FHIR server: ' + ex.message, ex.stack);
      throw ex;
    }

    const peopleBundle = results.data;
    const foundNextLink = (peopleBundle.link || []).find(link => link.relation === 'next');

    if (foundNextLink) {
      const nextPeopleBundle = await this.getAllPeople(foundNextLink.url);
      nextPeopleBundle.entry.forEach(next => peopleBundle.entry.push(next));
      peopleBundle.total = peopleBundle.entry.length;
    }

    return peopleBundle;
  }

  private async incrementNotificationsSent(person: Person) {
    person.lastExpirationSent = moment().format();
    person.expirationSentCount = person.expirationSentCount + 1;

    // Update the person
    const updatePersonUrl = buildFhirUrl(this.fhirServerBase, 'Person', person.id);

    try {
      await this.httpService.put(updatePersonUrl, person).toPromise();
      this.logger.log(`Incremented notification sent counter for ${person.id} to ${person.expirationSentCount}`);
    } catch (ex) {
      this.logger.error('Error updating person with the latest expiration notification date: ' + ex.message, ex.stack);
      throw ex;
    }
  }

  private async disableSubscription(fhirServerBase: string, subscriptionId: string) {
    const subscriptionUrl = buildFhirUrl(fhirServerBase, 'Subscription', subscriptionId);
    let getResults;

    try {
      getResults = await this.httpService.get<Subscription>(subscriptionUrl).toPromise();
    } catch (ex) {
      this.logger.error(`Error retrieving subscription ${subscriptionId} to disable: ${ex.message}`, ex.stack);
      throw ex;
    }

    const subscription = getResults.data;
    subscription.status = 'off';

    try {
      await this.httpService.put(subscriptionUrl, subscription).toPromise();
    } catch (ex) {
      this.logger.error(`Error disabling subscription ${subscriptionId} during update to FHIR server: ${ex.message}`, ex.stack);
    }
  }

  public async disableSubscriptions(fhirServerBase: string, person: Person) {
    const promises = (person.extension || [])
      .filter((ext) => {
        return ext.url === Constants.extensions.subscription &&
          ext.valueReference &&
          ext.valueReference.reference &&
          ext.valueReference.reference.split('/').length === 2;
      })
      .map((ext) => {
        const split = ext.valueReference.reference.split('/');
        return this.disableSubscription(fhirServerBase, split[1]);
      });

    await Promise.all(promises);

    this.logger.log(`Done disabling subscriptions for person ${person.id}`);
  }

  private async checkPerson(person: Person) {
    const expiration = this.contactInfoConfig.expiration;
    const notificationInterval = this.contactInfoConfig.notificationInterval;
    const lastUpdated = moment(person.meta.lastUpdated);

    const personExpiredDate = lastUpdated.clone().add(expiration.value, expiration.unit);
    this.logger.log(`Person ${person.id}'s contact information expires on ${personExpiredDate.local().format()}.`);

    const firstNotificationDate = personExpiredDate.clone().add('-' + notificationInterval.value.toString(), notificationInterval.unit);
    const lastExpirationSent = person.lastExpirationSent ? moment(person.lastExpirationSent) : undefined;
    const nextNotificationDate = lastExpirationSent ?
      lastExpirationSent.clone().add(notificationInterval.value, notificationInterval.unit) :
      firstNotificationDate;

    if (moment() > nextNotificationDate && person.expirationSentCount < this.contactInfoConfig.maxNotifications) {
      const sent = await this.sendExpirationNotification(person, moment() > personExpiredDate, personExpiredDate.format());

      if (sent) {
        await this.incrementNotificationsSent(person);
      }
    } else if (moment() > nextNotificationDate && person.expirationSentCount === this.contactInfoConfig.maxNotifications) {
      // disable the subscriptions associated with the person
      await this.disableSubscriptions(this.fhirServerBase, person);

      // increment the expiration-sent-count so that this logic is bypassed in the future
      await this.incrementNotificationsSent(person);
    }
  }

  private async executeInternal() {
    this.logger.log('Checking contact info');

    const allPeople = await this.getAllPeople();
    const expiration = this.contactInfoConfig.expiration;
    const notificationInterval = this.contactInfoConfig.notificationInterval;

    if (!expiration || !expiration.unit || !expiration.value) {
      this.logger.log('Not checking contact info expiration because server is not configured with an "expiration"');
      return;
    }

    if (!notificationInterval || !notificationInterval.unit || !notificationInterval.value) {
      this.logger.log('Not checking contact info expiration because server is not configured with a "notificationInterval"');
      return;
    }

    this.logger.log(`Found ${allPeople.entry.length} people to check contact info expiration for`);

    const promises = allPeople.entry.map(async (entry) => {
      const person = new Person(entry.resource);
      return this.checkPerson(person);
    });

    await Promise.all(promises);
  }

  private async sendExpirationNotification(person: Person, expired: boolean, expirationDate: string) {
    this.logger.log('Sending notification to person that their contact information has expired');

    const params = {
      first_name: person.firstName,
      last_name: person.lastName,
      expiration_date: expirationDate
    };

    // Include variables specified in the config in the templating params
    if (this.contactInfoConfig.templates && this.contactInfoConfig.templates.variables) {
      Object.assign(params, this.contactInfoConfig.templates.variables);
    }

    const htmlTemplatePath = expired ?
      path.resolve(this.contactInfoConfig.templates.expired.html) :
      path.resolve(this.contactInfoConfig.templates.expiring.html);
    const htmlTemplateContent = CheckContactInfo.prepareTemplate(fs.readFileSync(htmlTemplatePath).toString(), params);
    const textTemplatePath = expired ?
      path.resolve(this.contactInfoConfig.templates.expired.text) :
      path.resolve(this.contactInfoConfig.templates.expiring.text);
    const textTemplateContent = CheckContactInfo.prepareTemplate(fs.readFileSync(textTemplatePath).toString(), params);

    const mailMessage: Mail.Options = {
      from: this.emailConfig.from,
      to: person.email,
      subject: expired ?
        this.contactInfoConfig.templates.expired.subject :
        this.contactInfoConfig.templates.expiring.subject,
      html: htmlTemplateContent,
      text: textTemplateContent
    };

    // Send the message
    try {
      await this.transporter.sendMail(mailMessage);
      return true;
    } catch (ex) {
      this.logger.error(`Error sending email notification to update expired/expiring contact information: ${ex.message}`, ex.stack);
      return false;
    }
  }
}
