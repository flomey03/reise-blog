# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# The Astro config (database path, media directory, session driver) is
# evaluated at build time, so the volume paths must be set here as well —
# runtime environment variables would come too late.
ENV EMDASH_DATA_DIR=/data
ENV EMDASH_DB_PATH=/data/data.db
ENV EMDASH_UPLOADS_DIR=/uploads

# pnpm is pinned in package.json (packageManager)
RUN corepack enable

WORKDIR /app

# Install exactly what the lockfile says. Only production dependencies are
# needed: `astro build` runs with `astro` itself, which is a dependency.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY . .
# The build downloads the web fonts; a flaky network shouldn't fail a deploy.
RUN pnpm build || (sleep 5 && pnpm build) || (sleep 10 && pnpm build)

# ---- runtime --------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Same paths the build used, so runtime and build agree.
ENV EMDASH_DATA_DIR=/data
ENV EMDASH_DB_PATH=/data/data.db
ENV EMDASH_UPLOADS_DIR=/uploads

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed ./seed

# Data lives on volumes: /data (SQLite + sessions) and /uploads (media).
RUN mkdir -p /data /uploads

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
