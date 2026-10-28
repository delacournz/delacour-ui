# ui-web → Nitro's self-contained `.output` on a slim Bun image, run by the `start` script's own
# command. No workspace node_modules ships: Nitro bundles the server and traces the one native
# addon it loads at runtime (@resvg/resvg-js, linux build) into .output/server/node_modules.
#
# Not a single `bun build --compile` binary like delacour-monorepo's services: `.output/public` is
# ~170 MB (preview clips plus Nitro's precompressed .gz/.br copies), which `serveStatic: "inline"`
# would hold in memory, and the resvg addon is required by a platform-computed path the compiler
# cannot embed.
#
# Build context: repo root (the service's `dockerfilePath` in delacour-monorepo's
# apps/ui/infra/railway.ts, trimmed by the root .dockerignore).
FROM oven/bun:1.3.14 AS build
WORKDIR /repo
COPY . .
# The classic `read:packages` PAT bunfig.toml installs `@delacournz/*` with. Railway passes a
# service variable to a Dockerfile build only when it is an ARG. Build stage only: the runtime
# stage below never sees it.
ARG NPM_TOKEN
RUN : "${NPM_TOKEN:?NPM_TOKEN must be set (GitHub Packages install)}" && bun install --frozen-lockfile
# Vite inlines every VITE_* into the client bundle, so each one the service carries is an ARG.
# Declared after the install so changing one rebuilds the app, not the dependency layer.
#
# DEPLOY_ENV is the image-reuse guard, not a build input: Railway's skipped builds ignore
# variables, so one commit could ship staging's inlined values to production. Required, so a
# build without it fails loudly.
ARG DEPLOY_ENV
ARG VITE_GA_ID
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_TOKEN
RUN echo "building ui-web for ${DEPLOY_ENV:?DEPLOY_ENV must be set (railway.ts)}" \
	&& NODE_ENV=production bun run --filter=@delacour/web build
# `start` preloads `@delacournz/otel-start/preload`, which the Nitro bundle does not contain. Vendor
# the package as one self-contained bundle (its two entries share a chunk, so one copy of the
# OpenTelemetry API) so it resolves from /app/node_modules with nothing else installed.
RUN OTEL=node_modules/@delacournz/otel-start && mkdir -p /vendor/$OTEL \
	&& bun build $OTEL/dist/index.js $OTEL/dist/preload.js --target bun --splitting --outdir /vendor/$OTEL/dist \
	&& cp $OTEL/package.json /vendor/$OTEL/

FROM oven/bun:1.3.14-slim
WORKDIR /app
COPY --from=build --chown=bun:bun /vendor/node_modules ./node_modules
COPY --from=build --chown=bun:bun /repo/apps/web/.output ./.output
USER bun
ENV NODE_ENV=production
CMD ["bun", "--preload", "@delacournz/otel-start/preload", ".output/server/index.mjs"]
