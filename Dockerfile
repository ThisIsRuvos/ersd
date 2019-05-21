ARG config_file
FROM node AS build-kds

RUN mkdir /kds
WORKDIR /kds
COPY . /kds

RUN npm install -g @angular/cli
RUN npm ci --production
RUN ng build --prod=true client
RUN ng build --prod=true server

FROM node
RUN mkdir -p /kds/server && mkdir /kds/client
WORKDIR /kds
COPY --from=build-kds /kds/dist/apps/client/. /kds/client/
COPY --from=build-kds /kds/dist/apps/server/. /kds/server/

RUN if [ "x$config_file" = "x" ] ; then echo Config file not provided ; else COPY $config_file /kds/serer/config ; fi

WORKDIR /kds/server

EXPOSE 3333

ENTRYPOINT ["node", "main.js"]
