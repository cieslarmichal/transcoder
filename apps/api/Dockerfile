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

RUN turbo prune --scope="@apps/api" --docker

FROM base AS installer

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY tsconfig.json ./

RUN npm ci

COPY --from=builder /app/out/full/ .

RUN npm run build --filter="@apps/api"

FROM base AS runner

ENV NODE_CONFIG_DIR=/app/apps/api/config

COPY package*.json ./
COPY --from=installer /app/apps/api/dist ./apps/api
COPY --from=installer /app/apps/api/config ./apps/api/config
COPY --from=installer /app/apps/api/package.json ./apps/api/package.json

COPY --from=installer /app/libs/ ./libs/.temp

RUN for folder in /app/libs/.temp/*; do \
  package_name=$(basename $folder); \
  mkdir -p /app/libs/$package_name; \
  cp -r $folder/dist /app/libs/$package_name/dist; \
  cp $folder/package.json /app/libs/$package_name/package.json; \
  done

RUN rm -rf ./libs/.temp

RUN npm ci

USER node

CMD node apps/api/src/index.js
