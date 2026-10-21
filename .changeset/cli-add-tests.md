---
"delacour": minor
"@delacour/react-native-ui": patch
---

`add --tests` copies each component's `bun test` suites beside it, records them in the lock, and asks for `@types/bun`; `update` keeps copied tests current and `update --tests` brings them in. The registry ships each item's tests in a separate `tests` list, so older CLIs are unaffected.
