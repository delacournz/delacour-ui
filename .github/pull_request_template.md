<!-- Title: gitmoji + conventional type + package scope, e.g. `✨ feat(native-ui): add a swipeable Tabs pager`. -->

## What and why

<!-- One or two sentences. What changed, and what it is for. -->

## Screenshots

<!--
Required if this changes what anyone sees — the docs site, a component's
rendering, an app icon, the playground. Delete this section only when the diff
has no visual surface at all (the CLI, a config, a type).

They are not decoration; they are the only part of the review a reader can
check against their own eyes, so they must show THIS branch's head. Capture
them after the last visual commit, not at the start:

    cd apps/web && bun run start        # or bun run dev, in another shell
    bun run screenshots                 # → apps/web/screenshots/, gitignored

Then push them to `assets/<branch>` under the short SHA they photograph and
link the raw URLs here. `apps/web/AGENTS.md` has the whole procedure and the
reasons behind both halves of it.

**Push again and the pictures are stale.** A body that shows a control the
branch no longer has is worse than a body with no pictures — recapture in the
same push that changed the visuals.
-->

## Checklist

- [ ] Docs updated in the same commit — `native-ui`'s `docs.test.ts` fails by name for a component folder with no `AGENTS.md`
- [ ] `bun.lock` committed alongside any dependency change — CI installs with `--frozen-lockfile` and fails on drift
- [ ] `bun run previews` recaptured and committed, if a component's visuals changed (needs a Mac with Xcode; never runs in CI)
- [ ] Screenshots above captured from the current head, if this changes what anyone sees
