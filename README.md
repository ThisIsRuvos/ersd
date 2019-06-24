# Knowledge Distribution Services

This project was generated using [Nx](https://nx.dev).
**Nx is a set of Angular CLI power-ups for modern development.**

## NX Development Info

[30-minute video showing all Nx features](https://nx.dev/getting-started/what-is-nx)

[Interactive tutorial](https://nx.dev/tutorial/01-create-application)

## Building

```
ng build server
ng build client
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
| &nbsp;&nbsp;&nbsp;fhirServerBase | The base url of the FHIR server that provides data to the KDS components |
| &nbsp;&nbsp;&nbsp;subscriptionCriteria | The criteria to be used for each of the subscriptions that the end users setup. See [here](http://hl7.org/fhir/STU3/subscription-definitions.html#Subscription.criteria) for more details. |
| &nbsp;&nbsp;&nbsp;enableSubscriptions | Primarily for debugging purposes. When false, modified subscriptions are disabled (off). When true, modified subscriptions are submitted to the FHIR server with a status of "requested". See [here](http://hl7.org/fhir/STU3/subscription-definitions.html#Subscription.status) for more details. |
| &nbsp;&nbsp;&nbsp;restrictedResourceTypes | A list of resource types that are restricted from the FHIR proxy provided by the server. It is suggested that at least Person and Subscription be restricted, because these are resources directly influenced by the server and may include sensitive user information |
| &nbsp;&nbsp;&nbsp;contactInfo | Configurable properties related to contact information expiration reside in this group |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;checkDurationSeconds | Represents how often the KDS server should check for expired contact information. Every iteration will pull down a full list of the people registered in KDS (the FHIR server) and check each of their last modified date to determine whether their information has expired. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;checkCountPerPage | Represents how many people can be requested from the FHIR server in a single page. HAPI has a maximum of 50 per page. KDS will repeatedly request every page until no more pages of data are left to retrieve (to get the full list of people). |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;maxNotifications | How many notifications should be sent before the system stops sending notifications. One interval after the last notification, the user's subscriptions are suspended. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;expiration | Represents how long a user's contact information is valid for. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;value | A numeric value |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unit | The unit of measurement for the numeric value. Valid values are: 'month','months','m','year','years','y','day','days','d' |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;notificationInterval | How often emails should be sent to notify the user that their contact information is about to (or has) expired. The first expiration starts one interval prior to the actual expiration of the user's contact information. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;value | A numeric value |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unit | The unit of measurement for the numeric value. Valid values are: 'month','months','m','year','years','y','day','days','d' | 
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;templates | Templates for the emails that should be sent for contact information expiration. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;expiring | The information that is used to send the email notifying the user that their contact information is **about to expire**. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subject | The subject of the email |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;html | The HTML template to use for the email |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;text | The TEXT template to use for the email |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;expired | The information that is used to send emails notifying the user that their contact information **has expired**. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subject | The subject of the email |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;html | The HTML template to use for the email |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;text | The TEXT template to use for the email |
| email | Configuration that allows administrators to send emails to all users |
| &nbsp;&nbsp;&nbsp;from | The from address that emails are sent from. Should be in the format "joe@somewhere.com" |
| &nbsp;&nbsp;&nbsp;host | The host address of the SMTP server |
| &nbsp;&nbsp;&nbsp;port | The port for the SMTP server |
| &nbsp;&nbsp;&nbsp;tls | Whether to require TLS |
| &nbsp;&nbsp;&nbsp;username | Optional. The username to authenticate with the SMTP server. Both username and password must be provided to authenticate with basic credentials. |
| &nbsp;&nbsp;&nbsp;password | Optional. The password to authenticate with the SMTP server. Both username and password must be provided to authenticate with basic credentials. |
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
| {portal_link} | An http:// value/link to the KDS portal |
