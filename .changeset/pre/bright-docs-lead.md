---
"delacour": patch
---

Teach one verb, and hold the docs to the CLI

The Quick start forks before the first command — a new app, an existing one, or hand it to an
agent — and lands all three on one rendered Button. It scaffolds Expo's `with-router-uniwind`
example and never names `init`: `add` does that setup itself, so a reader learns one verb.

The landing page's hero says `add` too, the package path names Uniwind as a real setup step with
links to its own guide, and a handful of claims that had gone stale are corrected — the registry
holds no copy of the library's source, `/llms.txt` lives on `ui.delacour.co.nz`, and the releases
page no longer reports a version that was never published.

`docs-commands.test.ts` walks the commander program and holds every copyable `delacour …` in the
repository to it — verb, long flags, positional arity, and whether a component named in an example
is in the registry. It caught `add --src` before a reader did.
