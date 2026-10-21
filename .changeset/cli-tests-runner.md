---
"delacour": minor
"@delacour/react-native-ui": patch
---

`add --tests` writes copied suites for the project's own runner — Vitest, Jest or Bun, read from `package.json` or set with `tests.runner` in `native-components.json` — and asks for that runner's packages instead of `@types/bun`. The shipped suites keep to the API all three share, and the registry build fails on one that does not.
