FROM node AS build-kds

RUN mkdir -p /kds/server/config
WORKDIR /kds
COPY . .
COPY local.json /kds/server/config/

RUN npm install -g @angular/cli
RUN npm ci --no-optional
RUN ng build --prod=true client
RUN ng build --prod=true server

FROM node
RUN mkdir -p /kds/server && mkdir /kds/client
WORKDIR /kds
COPY --from=build-kds /kds/dist/apps/client/. /kds/client/
COPY --from=build-kds /kds/dist/apps/server/. /kds/server/

WORKDIR /kds/server

EXPOSE 3333

ENTRYPOINT ["node", "main.js"]
