---
"delacour": patch
"@delacour/react-native-ui": patch
---

Copied components no longer assume Bun or cite tests that are not copied. `add` strips maintainer-only notes and test-file rows from each component's `AGENTS.md`, the registry build fails on any shipped file that names Bun or an unshipped test, and the CLI prints Expo commands for the project's own package manager. The agent skill shows `npx` with its pnpm, yarn and bun equivalents.
