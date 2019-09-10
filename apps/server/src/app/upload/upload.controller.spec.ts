import nock from 'nock';
import {Test, TestingModule} from '@nestjs/testing';
import {UploadController} from './upload.controller';
import {HttpModule} from '@nestjs/common';
import {AuthRequest, AuthRequestUser} from '../auth-module/auth-request';
import {IUploadRequest} from '../../../../../libs/ersdlib/src/lib/upload-request';
import {AppService} from '../app.service';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { PassportModule } from '@nestjs/passport';

nock.disableNetConnect();

jest.mock('config', () => {
  return {
    server: {
      fhirServerBase: 'http://test-fhir-server.com'
    }
  };
});

describe('Subscription Controller', () => {
  let module: TestingModule;
  let adminUser: AuthRequestUser;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UploadController],
      imports: [HttpModule, PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [AppService]
    }).compile();
  });

  beforeEach(() => {
    nock.cleanAll();

    adminUser = {
      sub: 'test',
      email: 'test@test.com',
      name: 'test',
      given_name: 'test',
      family_name: 'test',
      realm_access: {
        roles: ['admin']
      }
    };
  });

  it('should be defined', () => {
    const controller: UploadController = module.get<UploadController>(UploadController);
    expect(controller).toBeDefined();
  });

  it('should fail if the user is not an admin', async (done) => {
    adminUser.realm_access.roles = [];      // THIS LINE IS IMPORTANT FOR THE TEST

    const controller: UploadController = module.get<UploadController>(UploadController);
    const request: AuthRequest = <AuthRequest> {
      user: adminUser
    };
    const requestBody: IUploadRequest = {
      fileName: 'test.xml',
      fileContent: '<Bundle><type value="searchset" /><entry></entry></Bundle>',
      message: 'this is a test'
    };

    try {
      await controller.upload(request, requestBody);
      done('expected upload to throw an exception');
    } catch (ex) {
      expect(ex.status).toEqual(401);
      expect(ex.message).toBeTruthy();
      expect(ex.message.error).toEqual('Unauthorized');
      expect(ex.message.message).toEqual('User is not an admin!');
      done();
    }
  });

  it('should attach a message extension to the Bundle', async () => {
    const controller: UploadController = module.get<UploadController>(UploadController);
    const request: AuthRequest = <AuthRequest> {
      user: adminUser
    };
    const requestBody: IUploadRequest = {
      fileName: 'test.xml',
      fileContent: '<Bundle xmlns="http://hl7.org/fhir">\n' +
        '   <id value="4e701cb4-46a2-49df-becd-686e51fb99c4"/>\n' +
        '   <meta>\n' +
        '      <lastUpdated value="2019-08-20T16:58:17.222+00:00"/>\n' +
        '   </meta>\n' +
        '   <type value="collection"/>\n' +
        '   <total value="1"/>\n' +
        '   <link>\n' +
        '      <relation value="self"/>\n' +
        '      <url value="http://hapi:8080/hapi-fhir-jpaserver/fhir/Bundle?_format=xml&amp;_pretty=true"/>\n' +
        '   </link>\n' +
        '   <entry>\n' +
        '      <fullUrl value="http://hapi:8080/hapi-fhir-jpaserver/fhir/Bundle/154"/>\n' +
        '      <resource>\n' +
        '         <Bundle xmlns="http://hl7.org/fhir">\n' +
        '            <id value="154"/>\n' +
        '            <meta>\n' +
        '               <versionId value="16"/>\n' +
        '               <lastUpdated value="2019-05-31T21:46:56.000+00:00"/>\n' +
        '            </meta>\n' +
        '            <type value="collection"/>\n' +
        '            <total value="19"/>\n' +
        '            <link>\n' +
        '               <relation value="self"/>\n' +
        '               <url value="https://example.com/base/MedicationRequest?"/>\n' +
        '            </link>\n' +
        '            <link>\n' +
        '               <relation value="next"/>\n' +
        '               <url value="https://example.com/base/MedicationRequest?"/>\n' +
        '            </link>\n' +
        '            <entry>\n' +
        '               <fullUrl value="https://example.com/base/MedicationRequest/3123"/>\n' +
        '               <resource>\n' +
        '                  <MedicationRequest xmlns="http://hl7.org/fhir">\n' +
        '                     <id value="3123"/>\n' +
        '                     <text>\n' +
        '                        <status value="generated"/>\n' +
        '                        <div xmlns="http://www.w3.org/1999/xhtml">\n' +
        '                           <p>\n' +
        '                              <b>Generated Narrative with Details</b>\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>id</b>: 3123\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>status</b>: unknown\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>intent</b>: order\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>medication</b>: \n' +
        '                              <a>Medication/example</a>\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>subject</b>: \n' +
        '                              <a>Patient/347</a> Some other test 8\n' +
        '                           </p>\n' +
        '                        </div>\n' +
        '                     </text>\n' +
        '                     <status value="unknown"/>\n' +
        '                     <intent value="order"/>\n' +
        '                     <medicationReference>\n' +
        '                        <reference value="Medication/example"/>\n' +
        '                     </medicationReference>\n' +
        '                  </MedicationRequest>\n' +
        '               </resource>\n' +
        '            </entry>\n' +
        '            <entry>\n' +
        '               <fullUrl value="https://example.com/base/Medication/example"/>\n' +
        '               <resource>\n' +
        '                  <Medication xmlns="http://hl7.org/fhir">\n' +
        '                     <id value="example"/>\n' +
        '                     <text>\n' +
        '                        <status value="generated"/>\n' +
        '                        <div xmlns="http://www.w3.org/1999/xhtml">\n' +
        '                           <p>\n' +
        '                              <b>Generated Narrative with Details</b>\n' +
        '                           </p>\n' +
        '                           <p>\n' +
        '                              <b>id</b>: example\n' +
        '                           </p>\n' +
        '                        </div>\n' +
        '                     </text>\n' +
        '                  </Medication>\n' +
        '               </resource>\n' +
        '               <search>\n' +
        '                  <mode value="include"/>\n' +
        '               </search>\n' +
        '            </entry>\n' +
        '         </Bundle>\n' +
        '      </resource>\n' +
        '      <search>\n' +
        '         <mode value="match"/>\n' +
        '      </search>\n' +
        '   </entry>\n' +
        '</Bundle>',
      message: 'this is a test'
    };

    const req = nock('http://test-fhir-server.com')
      .put('/Bundle/4e701cb4-46a2-49df-becd-686e51fb99c4', (bundle) => {
        expect(bundle.resourceType).toEqual('Bundle');
        expect(bundle.type).toEqual('collection');
        expect(bundle.entry).toBeTruthy();
        expect(bundle.entry.length).toEqual(1);
        expect(bundle.entry[0]).toBeTruthy();
        expect(bundle.entry[0].extension).toBeTruthy();
        expect(bundle.entry[0].extension.length).toEqual(1);
        expect(bundle.entry[0].extension[0].url).toEqual(Constants.extensions.notificationMessage);
        expect(bundle.entry[0].extension[0].valueString).toEqual('this is a test');
        return true;
      })
      .reply(200, {
        resourceType: 'Bundle',
        entry: [{
          fullUrl: 'http://test-fhir-server.com/Bundle/1',
          resource: {
            resourceType: 'Bundle',
            id: '1'
          }
        }]
      });

    await controller.upload(request, requestBody);

    req.done();
  });
});
