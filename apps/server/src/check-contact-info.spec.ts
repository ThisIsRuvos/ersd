import { CheckContactInfo } from './check-contact-info';
import { IBundle } from '../../../libs/kdslib/src/lib/bundle';
import { IPerson } from '../../../libs/kdslib/src/lib/person';
import { Constants } from '../../../libs/kdslib/src/lib/constants';
import { Subscription } from '../../../libs/kdslib/src/lib/subscription';
import { IServerConfigContactInfo } from './app/server-config';
import { IEmailConfig } from './app/email-config';

import * as path from 'path';
import nock from 'nock';
import moment from 'moment';

nock.disableNetConnect();

jest.mock('nodemailer');

const fhirServerBase = 'http://test-fhir-server.com';
const contactInfoConfig: IServerConfigContactInfo = {
  checkCountPerPage: 5,
  expiration: {
    value: 365,
    unit: 'days'
  },
  notificationInterval: {
    value: 31,
    unit: 'days'
  },
  maxNotifications: 2,
  templates: {
    expired: {
      subject: 'test',
      html: path.join(__dirname, 'config/templates/contact-info-expired.html'),
      text: path.join(__dirname, 'config/templates/contact-info-expired.txt')
    },
    expiring: {
      subject: 'test',
      html: path.join(__dirname, 'config/templates/contact-info-expiring.html'),
      text: path.join(__dirname, 'config/templates/contact-info-expiring.txt')
    }
  }
};
const emailConfig: IEmailConfig = {
  from: 'subscriptions@kds.com',
  host: 'some-smtp-host',
  port: 25
};

// Mock the "nodemailer" module so that we don't attempt to send real emails
jest.mock("nodemailer");

const sendMailMock = jest.fn().mockReturnValue(true);
const nodemailer = require("nodemailer"); // doesn't work with import. idk why
nodemailer.createTransport.mockReturnValue({"sendMail": sendMailMock});

describe('check-contact-info', () => {
  beforeEach(() => {
    nock.cleanAll();
    sendMailMock.mockClear();
    nodemailer.createTransport.mockClear();
  });

  it('should not send any notifications when no people are found', async () => {
    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, { total: 0, entry: [] });

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(0);
    req.done();
  });

  it('should not send any notifications when people have recently updated their contact info', async () => {
    const peopleBundle: IBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'Person',
          id: 'test',
          meta: {
            lastUpdated: moment().format()      // updated today
          }
        }
      }]
    };

    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, peopleBundle);

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(0);
    req.done();
  });

  it('should send a notification for the first time (before the actual expiration)', async () => {
    const peopleBundle: IBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'Person',
          id: 'test',
          meta: {
            lastUpdated: moment().add(-375, 'days').format()
          }
        }
      }]
    };

    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, peopleBundle)
      .put('/Person/test', (person: IPerson) => {
        // Ensure that the last expiration sent date has been recorded in
        // an extension for the person
        try {
          expect(person).toBeTruthy();
          expect(person.extension).toBeTruthy();
          expect(person.extension.length).toBe(2);
          expect(person.extension[0].url).toBe(Constants.extensions.lastExpirationSent);
          expect(person.extension[0].valueDateTime).toBeTruthy();
          expect(person.extension[1].url).toBe(Constants.extensions.expirationSentCount);
          expect(person.extension[1].valueInteger).toBe(1);

          const lastExpirationSent = moment(person.extension[0].valueDateTime);
          expect(lastExpirationSent.year()).toBe(moment().year());
          expect(lastExpirationSent.month()).toBe(moment().month());
          expect(lastExpirationSent.date()).toBe(moment().date());
          expect(lastExpirationSent.hour()).toBe(moment().hour());
          expect(lastExpirationSent.minute()).toBe(moment().minute());
        } catch (ex) {
          console.error('Person being updated did not match expectations: ' + ex.message);
          return false;
        }
        
        return true;
      })
      .reply(200);

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    req.done();
  });

  it('should not send second notification', async () => {
    const peopleBundle: IBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'Person',
          id: 'test',
          meta: {
            // expired yesterday
            lastUpdated: moment().add(-363, 'days').format()
          },
          extension: [{
            url: Constants.extensions.lastExpirationSent,
            // Last expiration sent thirteen days ago (less than one interval)
            valueDateTime: moment().add(-13, 'days').format()
          }]
        }
      }]
    };

    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, peopleBundle);

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(0);
    req.done();
  });

  it('should send a notification for the second time (on the date of the expiration)', async () => {
    const peopleBundle: IBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'Person',
          id: 'test',
          meta: {
            // expired yesterday
            lastUpdated: moment().add(-365 - contactInfoConfig.notificationInterval.value - 1, 'days').format()
          },
          extension: [{
            url: Constants.extensions.lastExpirationSent,
            // Last expiration sent one interval (plus a day) ago
            valueDateTime: moment().add((contactInfoConfig.notificationInterval.value * -1) - 1, 'days').format()
          }, {
            url: Constants.extensions.expirationSentCount,
            valueInteger: 1
          }]
        }
      }]
    };

    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, peopleBundle)
      .put('/Person/test', (person: IPerson) => {
        // Ensure that the last expiration sent date has been recorded in
        // an extension for the person
        try {
          expect(person).toBeTruthy();
          expect(person.extension).toBeTruthy();
          expect(person.extension.length).toBe(2);
          expect(person.extension[0].url).toBe(Constants.extensions.lastExpirationSent);
          expect(person.extension[0].valueDateTime).toBeTruthy();
          expect(person.extension[1].url).toBe(Constants.extensions.expirationSentCount);
          expect(person.extension[1].valueInteger).toBe(2);

          const lastExpirationSent = moment(person.extension[0].valueDateTime);
          expect(lastExpirationSent.year()).toBe(moment().year());
          expect(lastExpirationSent.month()).toBe(moment().month());
          expect(lastExpirationSent.date()).toBe(moment().date());
          expect(lastExpirationSent.hour()).toBe(moment().hour());
          expect(lastExpirationSent.minute()).toBe(moment().minute());
        } catch (ex) {
          console.error('Person being updated did not match expectations: ' + ex.message);
          return false;
        }

        return true;
      })
      .reply(200);

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    req.done();
  });


  it('should disable subscriptions on the third time', async () => {
    // last updated a year ago - one interval - 1 day
    const lastUpdated = moment().add(
      (contactInfoConfig.expiration.value * -1) -
      (contactInfoConfig.notificationInterval.value * 2) - 1, 'days');
    // Last expiration sent one interval and a day ago
    const lastExpirationSent = moment().add(
      (contactInfoConfig.notificationInterval.value * -1) - 1, 'days');

    const peopleBundle: IBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{
        resource: {
          resourceType: 'Person',
          id: 'test',
          meta: {
            lastUpdated: lastUpdated.format()
          },
          extension: [{
            url: Constants.extensions.subscription,
            valueReference: {
              reference: 'Subscription/test-sub'
            }
          }, {
            url: Constants.extensions.lastExpirationSent,
            valueDateTime: lastExpirationSent.format()
          }, {
            url: Constants.extensions.expirationSentCount,
            valueInteger: 2
          }]
        }
      }]
    };

    const req = nock('http://test-fhir-server.com')
      .get('/Person')
      .query({ _count: 5 })
      .reply(200, peopleBundle)
      .get('/Subscription/test-sub')
      .reply(200, { status: 'active' })
      .put('/Subscription/test-sub', (subscription: Subscription) => {
        try {
          expect(subscription).toBeTruthy();
          expect(subscription.status).toBe('off');
        } catch (ex) {
          console.error(`Subscription being updated did not match expectations: ${ex.message}`);
          return false;
        }

        return true;
      })
      .reply(200)
      .put('/Person/test', (person: IPerson) => {
        // Ensure that the last expiration sent date has been recorded in
        // an extension for the person
        try {
          expect(person).toBeTruthy();
          expect(person.extension).toBeTruthy();
          expect(person.extension.length).toBe(3);
          expect(person.extension[1].url).toBe(Constants.extensions.lastExpirationSent);
          expect(person.extension[1].valueDateTime).toBeTruthy();
          expect(person.extension[2].url).toBe(Constants.extensions.expirationSentCount);
          expect(person.extension[2].valueInteger).toBe(3);

          const lastExpirationSent = moment(person.extension[1].valueDateTime);
          expect(lastExpirationSent.year()).toBe(moment().year());
          expect(lastExpirationSent.month()).toBe(moment().month());
          expect(lastExpirationSent.date()).toBe(moment().date());
          expect(lastExpirationSent.hour()).toBe(moment().hour());
          expect(lastExpirationSent.minute()).toBe(moment().minute());
        } catch (ex) {
          console.error('Person being updated did not match expectations: ' + ex.message);
          return false;
        }

        return true;
      })
      .reply(200);

    await CheckContactInfo.execute(fhirServerBase, contactInfoConfig, emailConfig);
    expect(sendMailMock).toHaveBeenCalledTimes(0);
    req.done();
  });
});
