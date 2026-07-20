FROM debian:trixie-slim AS build-ersd

ARG NODE_VERSION=20.20.2

RUN apt-get update && \
	apt-get install -y --no-install-recommends \
		make gcc g++ python3 curl ca-certificates xz-utils && \
	curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
		| tar -xJ --strip-components=1 -C /usr/local && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /ersd

COPY . .

RUN npm install --max-old-space-size=8192 --legacy-peer-deps
RUN npm run build:server
RUN npm run build:client
RUN npm prune --omit=dev && \
	find node_modules -name "composer.lock" -delete && \
	find node_modules -name "composer.json" -not -path "*/node_modules/.package-lock.json" -delete && \
	rm -rf node_modules/emoji-toolkit/vendor \
		node_modules/esbuild \
		node_modules/@esbuild \
		node_modules/.bin/esbuild

FROM debian:trixie-slim

ARG NODE_VERSION=20.20.2

RUN apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y --no-install-recommends curl ca-certificates xz-utils && \
	curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
		| tar -xJ --strip-components=1 -C /usr/local && \
	apt-get purge -y --auto-remove curl xz-utils && \
	rm -rf /var/lib/apt/lists/* && \
	rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
		/usr/local/lib/node_modules/corepack /usr/local/bin/corepack

RUN mkdir -p /ersd/server && mkdir /ersd/client
WORKDIR /ersd

COPY --from=build-ersd /ersd/node_modules/. /ersd/node_modules/
COPY --from=build-ersd /ersd/dist/apps/client/. /ersd/client/
COPY --from=build-ersd /ersd/dist/apps/server/. /ersd/server/

WORKDIR /ersd/server
RUN mkdir -p /ersd/server/assets

EXPOSE 3333

ENTRYPOINT ["node", "main.js"]
