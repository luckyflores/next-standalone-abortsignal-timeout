# Mirrors nocmon's Dockerfile: node:20-alpine, Turbopack standalone build, then
# the FULL build node_modules copied over the standalone bundle at runtime.
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN corepack pnpm install --no-frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# node_modules overlay — the nocmon Dockerfile does exactly this.
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server.js"]
