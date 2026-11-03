---
"delacour": patch
---

Copied tests now typecheck on TypeScript 6. `add --tests` prepends a `/// <reference types>` for the runner's ambient types (`bun`, or `node` under Jest and Vitest), since TypeScript 6 — what Expo SDK 58 ships — defaults `types` to `[]` and every copied suite failed `tsc` in a fresh app.
