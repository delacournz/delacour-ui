---
"delacour": minor
---

The CLI now sends anonymous usage telemetry, on by default: the command, the names (never the values) of the flags typed, the components asked for from the official registry, the outcome and duration, the package manager and Expo SDK, and the OS, runtime and CI or coding-agent context, to `telemetry.delacour.co.nz`. It never sends source code, file names or paths, remote URLs, error messages or an IP address. A notice prints on first use. Turn it off with `delacour telemetry disable`, `DO_NOT_TRACK=1`, `DELACOUR_TELEMETRY_DISABLED=1` or `DELACOUR_CLI_TELEMETRY_DISABLED=1`; `DELACOUR_TELEMETRY_DEBUG=1` prints what would be sent instead. New `delacour telemetry [status|enable|disable]` command, documented at `/docs/native/cli#telemetry`.
