---
"delacour": patch
---

`update` merges a component's `AGENTS.md` that a project edited after copying it with an older CLI, instead of skipping it with no base to merge from — so docs still naming `bun test` pick up the package-manager-neutral text. The MCP `add_components` tool and the README describe `--tests` as copying tests written for the project's own runner.
