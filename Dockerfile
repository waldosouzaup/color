FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
RUN npm install --global pnpm@10.33.4
COPY package.json pnpm-lock.yaml ./
COPY db ./db
# Valores exclusivos do build, sem acesso a dados reais.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=colorimetry
ENV DIRECT_URL=postgresql://build:build@127.0.0.1:5432/build?schema=colorimetry
ENV BETTER_AUTH_SECRET=build-only-placeholder-with-no-production-access
ENV BETTER_AUTH_URL=http://127.0.0.1:3000
ENV APP_ENV=test
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
ENV APP_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
