# Cloud Agent base image for the Delacour UI monorepo.
#
# Ubuntu 24.04 to match the machine the library is developed on, with the two
# toolchains the repo pins installed system-wide so they resolve in every shell
# (login or not) rather than only where a profile has been sourced:
#
#   * Bun 1.3.9 — the `packageManager` in package.json. It drives install, the
#     turbo tasks and every workspace script.
#   * Node 24 — tsdown loads packages/cli/tsdown.config.ts with Node's native
#     TypeScript, which needs Node >= 22.18; an older Node falls back to the
#     optional `unrun` package, which is not installed, and the CLI build fails.
#     CI pins Node 24 in its registry and verify-expo jobs for the same reason.
#
# The image copies no repository source: Cursor checks out the requested
# revision separately, and `bun install` runs from that checkout in `install`.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        unzip \
        xz-utils \
        python3 \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Node 24 from NodeSource, installed to /usr/bin/node.
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node --version

# Bun 1.3.9, installed to /usr/local/bin/bun (BUN_INSTALL/bin).
ENV BUN_INSTALL=/usr/local
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.9" \
    && bun --version

# ubuntu:24.04 ships a `ubuntu` user at uid 1000; the agent runs as it.
USER ubuntu
