import {
  BadRequestException,
  Controller,
  Get,
  GoneException,
  Logger,
  Query,
  Req,
  Response,
  UnauthorizedException
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response as Res } from 'express';
import { Request } from 'express';
import { Constants } from '../../../../../libs/ersdlib/src/lib/constants';
import { IBundle } from '../../../../../libs/ersdlib/src/lib/bundle';
import { Person } from '../../../../../libs/ersdlib/src/lib/person';
import { AppService } from '../app.service';
import S3 from 'aws-sdk/clients/s3';
import { Fhir } from 'fhir/fhir';

@Controller('ersd')
export class eRSDController {
  private readonly logger = new Logger('eRSDController');
  constructor(private httpService: HttpService, private appService: AppService) {
  }

  private validFormat(format): boolean { return format === 'xml' || format === 'json' || format === 'md' }

  private assertApiKey(request: Request): Promise<Person | void> {
    let authorization: string;

    if (request.header('authorization')) {
      authorization = request.header('authorization');

      if (!authorization.startsWith('Bearer ')) {
        throw new UnauthorizedException('Authorization is not Bearer');
      }

      authorization = authorization.substring('Bearer '.length);
    } else if (request.query['api-key']) {
      authorization = request.query['api-key'] as string;
    } else {
      throw new UnauthorizedException('You have not specified an authorization key');
    }

    const tagQuery = `${Constants.tags.inboundApiKey}|${authorization}`;
    const url = this.appService.buildFhirUrl('Person', null, { _tag: tagQuery });

    return this.httpService.get<IBundle>(url).toPromise()
      .then((results) => {
        const bundle = results.data;

        if (bundle.total > 1) {
          throw new UnauthorizedException('Multiple users are associated with the specified API key. Cannot authenticate.');
        }

        if (bundle.total === 0) {
          throw new UnauthorizedException();
        }

        return new Person(bundle.entry[0].resource);
      }).catch((error) => {
        this.logger.error(`Error fetching Person from FHIR server: ${error}`)
        throw new UnauthorizedException('Invalid API Key');
      });
  }

  private stripOuterBundleJSON(bundle: IBundle) {
    return bundle.entry.find((entry) => entry.resource.resourceType === 'Bundle').resource
  }

  private stripOuterBundleXML(bundle: string) {
    const fhir = new Fhir()
    const jsonBundle: IBundle = fhir.xmlToObj(bundle) as IBundle
    const bundleEntry = jsonBundle.entry.find((entry) => entry.resource.resourceType === 'Bundle').resource
    const fhirXML = fhir.objToXml(bundleEntry)
    const validationCheck = fhir.validate(fhirXML)
    if (validationCheck.valid === false) { throw Error('Invalid XML input, please check resource in S3') }
    return fhirXML
  }

  @Get('v1specification')
  async getV1Spec(@Req() request: Request) {
    await this.assertApiKey(request);
    throw new GoneException('eRSD Version 1 is no longer available. Please use eRSD Version 3 at /ersd/v3specification');
  }

  @Get('v1supplemental')
  async getV1Supplemental(@Req() request: Request) {
    await this.assertApiKey(request);
    throw new GoneException('eRSD Version 1 supplemental is no longer available. Please use eRSD Version 3 at /ersd/v3specification');
  }

  @Get('v2specification')
  async getV2Spec(@Req() request: Request) {
    await this.assertApiKey(request);
    throw new GoneException('eRSD Version 2 is no longer available. Please use eRSD Version 3 at /ersd/v3specification');
  }

  @Get('v2supplemental')
  async getV2Supplemental(@Req() request: Request) {
    await this.assertApiKey(request);
    throw new GoneException('eRSD Version 2 supplemental is no longer available. Please use eRSD Version 3 at /ersd/v3specification');
  }

  @Get('v3specification')
  async getV3Spec(@Req() request: Request, @Query() queryParams, @Response() response: Res) {
    await this.assertApiKey(request);

    const format = queryParams['format'].toLowerCase()
    if (!format || !this.validFormat(format)) { throw new BadRequestException('Please specify a valid download format: XML or JSON') }

    const Bucket = this.appService.serverConfig.payload.Bucket;
    const Key = format === 'xml' ? this.appService.serverConfig.payload.ERSDV3_SPECIFICATION_XML_KEY :
      this.appService.serverConfig.payload.ERSDV3_SPECIFICATION_JSON_KEY

    if (typeof Bucket === 'undefined' || Bucket === '' || Key === '') {
      const errorMessage = 'Failed to download from S3, no Bucket or Key specified'
      this.logger.error(errorMessage);
      throw Error(errorMessage);
    }

    const s3client = new S3();

    const headParams = {
      Bucket,
      Key,
    }
    const data = await s3client.getObject(headParams).promise();
    const body = data.Body.toString('utf-8')
    if (format === 'xml') {
      return response.set({ 'Content-Type': 'text/xml' }).send(body)
    } else {
      return response.set({ 'Content-Type': 'application/json' }).json(JSON.parse(body))
    }
  }

  // Markdown functions
  // Get v3 markdown
  @Get('markdown')
  async getMarkdown(@Response() response: Res) {

    const Bucket = this.appService.serverConfig.payload.Bucket;
    const Key = this.appService.serverConfig.payload.ERSDV3_CHANGE_PREVIEW_SUMMARY_KEY;

    if (!Bucket) {
      const errorMessage = 'Failed to download from S3, missing Bucket';
      console.error(errorMessage);
      return response.status(500).json({ error: errorMessage });
    }

    const s3client = new S3();
    let markdownFiles = {};

    if (Key) {
      const params = { Bucket, Key };

      try {
        const data = await s3client.getObject(params).promise();
        markdownFiles['markdownFile2'] = data.Body.toString();
      } catch (error) {
        console.error(`Error fetching Markdown from S3 for Key: ${error}`);
      }
    }

    response.set('Content-Type', 'application/json');
    response.json(markdownFiles);
  }
}