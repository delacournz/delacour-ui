---
"delacour": minor
---

`add` sets the project up itself

`add` no longer fails on a project with no `native-components.json`. It runs `init` first — writing
the config, wrapping Metro, pointing Tailwind at the components and copying the theme and the root
provider in — and then adds what was asked for. That was previously a prompt, and only where there
was a terminal to ask in, so `--yes`, CI and every MCP call hit `MissingConfigError` while a human
sailed past. `--no-init` is the opt-out, and `-s, --src <dir>` forwards to `init` so a template that
keeps its files at the project root still needs one command.

`init` now returns the result of the `add` it ends on, so a caller that set a project up still
learns what the components need from npm.

New MCP tool `init_project`, for the layout an agent cannot infer — a shared package in a monorepo,
or a source directory that is not `src`. `add_components` needs it no more often than a person
needs `init`.
