---
"delacour": patch
---

`add` installs `tailwind-variants` at `^3.3.1`, the range the library is built against, instead of `latest`. tailwind-variants 4 throws on the `createTV({ twMergeConfig })` call every copied `tv.ts` makes, so a project added to after its release broke at import.
