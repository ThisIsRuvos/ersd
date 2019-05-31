FROM node:10.16.0 AS build-kds

RUN mkdir -p /kds
WORKDIR /kds
COPY . .

RUN npm install -g @angular/cli
RUN npm install
RUN ng build --prod=true client
RUN ng build server

FROM node
RUN mkdir -p /kds/server && mkdir /kds/client
WORKDIR /kds
COPY --from=build-kds /kds/node_modules/. /kds/node_modules/
COPY --from=build-kds /kds/dist/apps/client/. /kds/client/
COPY --from=build-kds /kds/dist/apps/server/. /kds/server/
COPY local.json /kds/server/config/

WORKDIR /kds/server

EXPOSE 3333

ENTRYPOINT ["node", "main.js"]
