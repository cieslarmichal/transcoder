FROM node:22.11.0-alpine AS base

RUN apk update

WORKDIR /app

FROM base AS builder

RUN npm i -g turbo

COPY package*.json ./
COPY turbo.json ./
COPY apps/ ./apps
COPY libs/ ./libs
COPY tsconfig.json ./

RUN turbo prune --scope="@apps/playlist-sticher" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/playlist-sticher"

FROM base AS runner

ENV NODE_CONFIG_DIR=/app/apps/playlist-sticher/config

COPY package*.json ./
COPY --from=installer /app/apps/playlist-sticher/dist ./apps/playlist-sticher
COPY --from=installer /app/apps/playlist-sticher/config ./apps/playlist-sticher/config
COPY --from=installer /app/apps/playlist-sticher/package.json ./apps/playlist-sticher/package.json

COPY --from=installer /app/libs/ ./libs/.temp

RUN for folder in /app/libs/.temp/*; do \
  package_name=$(basename $folder); \
  mkdir -p /app/libs/$package_name; \
  cp -r $folder/dist /app/libs/$package_name/dist; \
  cp $folder/package.json /app/libs/$package_name/package.json; \
  done

RUN rm -rf ./libs/.temp

RUN npm ci

RUN mkdir -p /shared && chmod -R 777 /shared

USER node

CMD node apps/playlist-sticher/src/index.js
