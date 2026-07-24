FROM node:22.23.1-trixie-slim AS build-ersd

WORKDIR /ersd

COPY . .

# Give Node enough heap for the Angular client build; the runner (saas-linux-large)
# has 16 GB, and the browser builder OOMs with the default ~2 GB heap.
ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN apt-get update && \
	apt-get install -y --no-install-recommends make gcc g++ python3 && \
	rm -rf /var/lib/apt/lists/*

RUN npm install --legacy-peer-deps
RUN npm run build:server
RUN npm run build:client
RUN npm prune --omit=dev && \
	find node_modules -name "composer.lock" -delete && \
	find node_modules -name "composer.json" -not -path "*/node_modules/.package-lock.json" -delete && \
	rm -rf node_modules/emoji-toolkit/vendor \
		node_modules/esbuild \
		node_modules/@esbuild \
		node_modules/.bin/esbuild

FROM node:22.23.1-trixie-slim

RUN apt-get update && \
	apt-get upgrade -y && \
	rm -rf /var/lib/apt/lists/* && \
	# Runtime does not need Node headers/docs/npm (Inspector flags bundled OpenSSL headers)
	rm -rf /usr/local/include /usr/local/share/doc /usr/local/share/man \
		/usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
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
