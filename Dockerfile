FROM node:10.16.0 AS build-ersd

RUN mkdir -p /ersd
WORKDIR /ersd
COPY . .

RUN npm install -g @angular/cli
RUN npm ci
RUN ng build --prod=true client
RUN ng build server

FROM node
RUN mkdir -p /ersd/server && mkdir /ersd/client
WORKDIR /ersd
COPY --from=build-ersd /ersd/node_modules/. /ersd/node_modules/
COPY --from=build-ersd /ersd/dist/apps/client/. /ersd/client/
COPY --from=build-ersd /ersd/dist/apps/server/. /ersd/server/

WORKDIR /ersd/server

EXPOSE 3333

ENTRYPOINT ["node", "main.js"]
