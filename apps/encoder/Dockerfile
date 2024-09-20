FROM node:20.17.0-alpine AS base

RUN apk update

WORKDIR /app

FROM base AS builder

RUN npm i -g turbo

COPY package*.json ./
COPY turbo.json ./
COPY apps/ ./apps
COPY libs/ ./libs
COPY tsconfig.json ./

RUN turbo prune --scope="@apps/encoder" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/encoder"

FROM base AS runner

ENV NODE_CONFIG_DIR=/app/apps/encoder/config

COPY package*.json ./
COPY --from=installer /app/apps/encoder/dist ./apps/encoder
COPY --from=installer /app/apps/encoder/config ./apps/encoder/config
COPY --from=installer /app/apps/encoder/package.json ./apps/encoder/package.json

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

CMD node apps/encoder/src/index.js
