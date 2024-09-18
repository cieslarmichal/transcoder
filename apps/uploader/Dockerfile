FROM node:20.17.0-alpine AS base

RUN apk update

WORKDIR /app

FROM base AS builder

RUN npm i -g turbo

COPY package*.json ./
COPY turbo.json ./
COPY apps/ ./apps
COPY common/ ./common
COPY tsconfig.json ./

RUN turbo prune --scope="@apps/uploader" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/uploader"

FROM base AS runner

ENV NODE_CONFIG_DIR=/app/apps/uploader/config

COPY package*.json ./
COPY --from=installer /app/apps/uploader/dist ./apps/uploader
COPY --from=installer /app/apps/uploader/config ./apps/uploader/config
COPY --from=installer /app/apps/uploader/package.json ./apps/uploader/package.json

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

CMD node apps/uploader/src/index.js
