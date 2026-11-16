# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# pnpm is pinned in package.json (packageManager)
RUN corepack enable

WORKDIR /app

# Install exactly what the lockfile says. Only production dependencies are
# needed: `astro build` runs with `astro` itself, which is a dependency.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY . .
RUN node docker/check-workerd.mjs
RUN pnpm build

# ---- runtime --------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed ./seed

# Generates the encryption key into the data volume on first start, unless the
# environment provides one.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4321

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "./dist/server/entry.mjs"]
