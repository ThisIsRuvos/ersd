# Kds

This project was generated using [Nx](https://nx.dev).

<p align="center"><img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" width="450"></p>

🔎 **Nx is a set of Angular CLI power-ups for modern development.**

## Quick Start & Documentation

[30-minute video showing all Nx features](https://nx.dev/getting-started/what-is-nx)

[Interactive tutorial](https://nx.dev/tutorial/01-create-application)

## Building

```
ng build server
ng build client
```

## Running

```
node DEPLOY_LOCATION/server/main.js
```

When developing the application, DEPLOY_LOCATION is the "dist" directory

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
