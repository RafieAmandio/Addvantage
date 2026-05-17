# syntax=docker/dockerfile:1.7

# ---------- base ----------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
RUN pnpm install --frozen-lockfile --prod=false

# ---------- source ----------
FROM deps AS source
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api

# ---------- runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini && corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=source /repo ./
USER node
WORKDIR /repo/apps/api
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
EXPOSE 3100
