#!/usr/bin/env bash
set -euo pipefail

# Docs site (apps/web). Idempotent: a boot that finds :3000 already answering leaves it.
# Vite refuses to move off 3000 (strictPort), so a second copy is a failed boot.
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:3000/; then
	exit 0
fi

# start's stdout is a log file, not a terminal. Turbo's TUI would sit there waiting.
export TURBO_UI=stream
exec bun run dev:web
