---
"delacour": patch
---

`delacour update` now asks what to do with the files it skipped.

A file copied before `native-components.lock.json` existed, which no longer matches the registry,
has nothing to merge from, so `update` leaves it alone. Run at a terminal, it now finishes, reports,
and then asks about those files: leave them, merge them from a ref you type in (what `--base <ref>`
does), or replace them with the registry's copy. Replacing asks again before touching a file with
uncommitted changes.

Nothing is asked under `--yes`, `--json`, in CI or over MCP — there the files stay skipped, as
before.
