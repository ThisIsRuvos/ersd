# Electronic Reporting and Surveillance Distribution

This project was generated using [Nx](https://nx.dev).
**Nx is a set of Angular CLI power-ups for modern development.**

## NX Development Info

[30-minute video showing all Nx features](https://nx.dev/getting-started/what-is-nx)

[Interactive tutorial](https://nx.dev/tutorial/01-create-application)

## Pre-Requisities
- Docker
- Python 2
- NodeJs 14.x
- @angular/cli (`npm install -g @angular/cli`)


## Quick Setup with Docker

#### Environment Variables

The following environment variables are required to run the application:
  - S3 Credentials to be populated in `docker-compose.yml` and within `apps/server/confg/default.json` under payload bucket and key
  <!-- - SMTP details if you want to send emails to users. These can be populated in `apps/server/config/default.json` under email -->

To get started quickly, you can use the docker-compose.yml file in the root of the project. This will start a FHIR server, a KeyCloak server, and the ERSD server. The FHIR server and KeyCloak server will be pre-configured with the necessary data to run the ERSD server, however an additional step is needed to configure the KeyCloak with the ERSD client.

To start the servers, run the following command from the root of the project:

`npm install && npm run build`
`docker compose up`

Once the servers are running, you must configure the ERSD client in KeyCloak. To do this, you can run the script at in the root of the project:

`./apps/keycloak/configure`

While developing the application, you can run `npm run dev` to hot reload latest changes.

After the servers are running, you can access the ERSD application at http://localhost:3333 and login with:
```
username: johndoe
passowrd: password
```
## Building

```
npm run build
```

## Running

```
cd DEPLOY_LOCATION/server
node main.js
```

When developing the application, DEPLOY_LOCATION is the "dist" directory.
The server must be run from the DEPLOY_LOCATION so that the "config" directory is relative to the working directory of the server.  

## Deploying

* Build both the client and the server
* Copy both "client" and "server" directories from the "dist" directory into your destination deployment directory
* Run the server

## Developers

Add the --watch flag to both "ng build" commands to have the application automatically re-built when changes are detected to source code (.ts files).

DEPLOY_LOCATION is the "dist" directory while developing.

### Running unit tests

Run `ng test` to execute the unit tests via [Jest](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Cypress](http://www.protractortest.org/).

### Configuration

The application uses the [config](https://www.npmjs.com/package/config) module to provide environment/deployment configurations to the server. 
A portion of the configuration is dedicated to the client/browser application. When the client/browser application launches, the
client/browser application asks the server for the client config.

To override the default configuration for a specific deployment, either 

1. Create a "local.json" file in the config directory of the server app
2. Create sn environment-specific json file in the config directory of the server app (such as "production.json") and create an environment variable on the server called "NODE_ENV" with a value of "production" (for example).

The overriding config file can be a complete copy of the default.json file with modifications, or it can include only the properties that you want to override in the default.json. 

| Property | Description |
| -------- | ----------- |
| server | Generic configuration properties for the entire server |
| &nbsp;&nbsp;&nbsp;port | The port that the server application runs on |
| &nbsp;&nbsp;&nbsp;authCertificate | The certificate that should be used to validate authentication tokens provided by the UI |
| &nbsp;&nbsp;&nbsp;fhirServerBase | The base url of the FHIR server that provides data to the ERSD components |
| &nbsp;&nbsp;&nbsp;subscriptionCriteria | The criteria to be used for each of the subscriptions that the end users setup. See [here](http://hl7.org/fhir/STU3/subscription-definitions.html#Subscription.criteria) for more details. |
| &nbsp;&nbsp;&nbsp;enableSubscriptions | Primarily for debugging purposes. When false, modified subscriptions are disabled (off). When true, modified subscriptions are submitted to the FHIR server with a status of "requested". See [here](http://hl7.org/fhir/STU3/subscription-definitions.html#Subscription.status) for more details. |
| &nbsp;&nbsp;&nbsp;restrictedResourceTypes | A list of resource types that are restricted from the FHIR proxy provided by the server. It is suggested that at least Person and Subscription be restricted, because these are resources directly influenced by the server and may include sensitive user information |
| &nbsp;&nbsp;&nbsp;contactInfo | Configurable properties related to contact information expiration reside in this group |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;checkDurationSeconds | Represents how often the ERSD server should check for expired contact information. Every iteration will pull down a full list of the people registered in ERSD (the FHIR server) and check each of their last modified date to determine whether their information has expired. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;checkCountPerPage | Represents how many people can be requested from the FHIR server in a single page. HAPI has a maximum of 50 per page. ERSD will repeatedly request every page until no more pages of data are left to retrieve (to get the full list of people). |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;maxNotifications | How many notifications should be sent before the system stops sending notifications. One interval after the last notification, the user's subscriptions are suspended. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;expiration | Represents how long a user's contact information is valid for. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;value | A numeric value |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unit | The unit of measurement for the numeric value. Valid values are: 'month','months','m','year','years','y','day','days','d' |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;value | A numeric value |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unit | The unit of measurement for the numeric value. Valid values are: 'month','months','m','year','years','y','day','days','d' | 
| client | Anything in the section is sent to the client/browser application when the client/browser application launches |
| &nbsp;&nbsp;&nbsp;keycloak | Information about the keycloak installation, so that the browser knows where to send the user when they ask to login |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;url | The URL of the keycloak server. Ex: https://keycloak.somedomain.com/auth |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;realm | The realm that the keycloak application is registered within |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;clientId | The id of the client application in keycloak |   

#### server.authCertificate
This property must take the form of "------ BEGIN CERTIFICATE ------\n.............\n------ END CERTIFICATE -----". In other words, it must be wrapped with

`----- BEGIN CERTIFICIATE -----`

Followed by a line break

Followed by the actual certificate contents

Followed by a line break

`----- END CERTIFICATE -----`

#### server.subscriptionCriteria
Changing the criteria in the config does not automatically update already-existing subscriptions. Only new subscriptions are affected by the updated criteria.

#### email template parameters
The templates used to email may contain the following parameters:

| Parameter | Description |
| --------- | ----------- |
| {first_name} | The first name of the user |
| {last_name} | The last name of the user |
| {expiration_date} | The date that the user's contact information expires |
| {portal_link} | An http:// value/link to the ERSD portal |

#### Hapi Server
The NEW Hapi Server will need environment settings 

| Parameter | Description |
| --------- | ----------- |
| spring.datasource.url | <Fill this in, example: jdbc:postgresql://hapi-db:5432/hapi_db>
| spring.datasource.driverClassName | org.postgresql.Driver
| spring.datasource.username | <Fill this in, example: smith>
| spring.datasource.password | <Fill this in, example: password>
| spring.jpa.properties.hibernate.dialect | ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgres94Dialect
| hapi.fhir.fhir_version | R4
| hapi.fhir.client_id_strategy | ANY

## HAPI Notes

### Uploading Bundles

HAPI does not currently accept storing any Bundle resources with a type that is not "collection". If you attempt to upload a Bundle with a type of "searchset" or "transaction", the HAPI FHIR server will respond to the ERSD server with the following error:

`Unable to store a Bundle resource on this server with a Bundle.type value of: searchset`

The HAPI team has been asked to change this so that Bundle resources may be stored with all possible "type" values. They have agreed to make the change, but have not committed to a date.

## KeyCloak Notes

### Setting up the application for ERSD in KeyCloak

You must properly configure the "Web Origins" and "Valid Redirect URIs" properties of the application in KeyCloak. For example, if your ERSD installation is installed at https://ersd.mycompany.com then you must set the "Web Origins" property to "https://ersd.mycompany.com" and the "Valid Redirect URIs" should be "https://ersd.mycompany.com/*".

### Reverse Proxy
To successfully reverse proxy a KeyCloak installation, you must modify the `standalone.xml` file to include `proxy-address-forwarding="true"` and `redirect-socket="proxy-https"` to the `<http-listener>` element and change the `<socket-binding>` element to have a port of "443". For example:

```
<http-listener name="default" socket-binding="http" proxy-address-forwarding="true" redirect-socket="proxy-https" enable-http2="true"/>
<socket-binding name="https" port="443"/>
```

### Registration Attributes

ERSD attempts to reuse information from the KeyCloak account to make the registration process in ERSD quicker/easier for the end-user.

"First Name", "Last Name" and "Email" should always be available from KeyCloak to ERSD, as those are required fields for KeyCloak and are automatically provided to ERSD during authentication.

The following table indicates what KeyCloak custom attributes are recognized by ERSD. These custom attributes can be captured as part of custom templates used by the KeyCloak registration screen; custom configuration of KeyCloak would be required to have KeyCloak capture these custom attributes.

| ERSD Field | KC  Attr 1 | KC Attr 2 | KC Attr 3 |
| ---------- | --------------- | -------------- | -------------- |
| Mobile Phone | mobile | cell | |
| Office Phone | office | | |
| Street Address | street | address | line |
| City | city | | |
| State | state | st | |
| Postal Code | postal | postalCode | zip |

Refer to the [this link](https://medium.com/@auscunningham/create-a-custom-theme-for-keycloak-8781207be604) for guidance on how to create a custom keylcoak template that captures custom fields (such as the fields listed in the table above).
