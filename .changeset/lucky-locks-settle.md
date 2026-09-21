---
"delacour": patch
---

Refresh the lockfile and drop an obsolete patch

`bun.lock` pinned `expo-modules-jsi@57.0.5` while a dependency already required `~57.1.0`, so
`bun install --frozen-lockfile` failed the moment anything forced a re-resolve. The patch that
pinning existed for — declaring `retainRuntimeScheduler` / `releaseRuntimeScheduler` for Swift
bridging — ships in `57.1.0` itself, so it and its `patchedDependencies` entry are gone.
