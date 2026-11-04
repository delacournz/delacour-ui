---
"delacour": minor
---

`native-components.json` records a `version`. `init` writes the current one, and `update` brings an older config up to it first: at a terminal it asks once about each option the file predates (`tests.enabled`, and `prefix` while nothing is copied yet), then records the answers and the version. `--yes` keeps the defaults; `--json`, a pipe, CI and the MCP server leave the file alone and name what is still to choose. `doctor` warns on a config that is behind, or written by a newer CLI. The docs gain an Updating guide.
