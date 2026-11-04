---
"delacour": patch
---

`add` and `update` install a package again at the library's range when `package.json` has it below
that range — a project on `tailwind-variants` 3 now gets 4, which the copied `lib/tv.ts` imports from.
The report names each one and the version it found. `update` also reads an old ref out of git when the
registry is a local directory, so a linked CLI merges an edited file instead of skipping it and
copying newer tests beside the old source.
