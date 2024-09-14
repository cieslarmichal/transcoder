FROM node:20.17.0-alpine AS base

RUN apk update
RUN apk add --no-cache libc6-compat bash

WORKDIR /app

FROM base AS builder

RUN npm i -g turbo

COPY package*.json ./
COPY turbo.json ./
COPY apps/ ./apps
COPY common/ ./common
COPY tsconfig.json ./

RUN turbo prune --scope="@apps/downloader" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/downloader"

FROM base AS runner

ENV NODE_CONFIG_DIR=/app/apps/downloader/config

COPY package*.json ./
COPY --from=installer /app/apps/downloader/dist ./apps/downloader
COPY --from=installer /app/apps/downloader/config ./apps/downloader/config
COPY --from=installer /app/apps/downloader/package.json ./apps/downloader/package.json

COPY --from=installer /app/common/ ./common/.temp

RUN for folder in /app/common/.temp/*; do \
  package_name=$(basename $folder); \
  mkdir -p /app/common/$package_name; \
  cp -r $folder/dist /app/common/$package_name/dist; \
  cp $folder/package.json /app/common/$package_name/package.json; \
  done

RUN rm -rf ./common/.temp

RUN npm ci

RUN mkdir -p /shared && chmod -R 777 /shared

USER node

CMD node apps/downloader/src/index.js
