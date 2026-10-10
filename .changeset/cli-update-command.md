---
"delacour": minor
---

Add `delacour update`, which brings copied components up to the registry and keeps your edits.

`add` now records where each file came from in `native-components.lock.json` — the registry ref and
a hash of the text as the registry served it. `update` uses that to tell an upstream fix from a
local change: a file only the registry moved is replaced, a file only you moved is left alone, and
a file both moved is three-way merged. Where both changed the same lines the file is written with
git conflict markers and the command exits `1`; an edit is never overwritten.

Your own formatter (Biome or Prettier, from your `node_modules`) is run over the registry's side
before anything is compared, so a file you only reformatted counts as untouched and an update
arrives in your style.

- `update --dry-run` reports the plan and writes nothing; `--json` prints it.
- `update --base <ref>` merges files that were copied before the lock existed.
- `update --prune` deletes untouched files a component no longer has.
- `diff` now prints the plan `update` would apply, so for a tracked file it shows the registry's
  change on its own rather than both sides.
- The MCP server gains `check_updates` and `update_components`, and `doctor` warns when components
  are present with no lock file.

Commit `native-components.lock.json`. A project without one keeps working: the first `update`
records every file that still matches the registry.
