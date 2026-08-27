<!-- Title: gitmoji + conventional type + package scope, e.g. `✨ feat(native-ui): add a swipeable Tabs pager`. -->

## What and why

<!-- One or two sentences. What changed, and what it is for. -->

## Checklist

- [ ] Docs updated in the same commit — `native-ui`'s `docs.test.ts` fails by name for a component folder with no `AGENTS.md`
- [ ] `bun.lock` committed alongside any dependency change — CI installs with `--frozen-lockfile` and fails on drift
- [ ] `bun run previews` recaptured and committed, if a component's visuals changed (needs a Mac with Xcode; never runs in CI)
