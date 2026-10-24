# Preview media follows the pixels

**A change that can move a component's pixels recaptures its previews in the same branch, before the
pull request opens.** A demo's capture hash covers the demo, not the component it renders, so an
incremental `bun run previews` after a library change re-captures nothing and the docs site keeps
the old picture until someone asks.

- **Triggers:** `packages/react-native-ui/src/components/<name>/`, `apps/playground/src/demos/<name>/`,
  `apps/playground/e2e/previews/<name>.e2e.ts`, the `lib/` / `styles/` / `hooks/` a component renders
  through, or an engine package. `bun run previews:affected` lists the components, importers included.
- **Exempt:** tests, fixtures, markdown, types-only edits, comments, and logic no captured demo renders
  differently. Unsure → recapture.
- **Run:** `bun run previews -- -- --only <list> --force --headless` (drop `--force` only when the
  demo or spec itself changed), review the media, commit `apps/web/public/previews/**` and
  `apps/web/src/previews/manifest.ts`.
- **PR:** push, then embed `bun run previews:pr-table` (before/after, raw URLs pinned to SHAs) in the
  body **at creation**, whether through `gh pr create` or the `dlc-pr` skill. Never a follow-up edit.

Load the `recapture-previews` skill for the full loop. The rule in full: root `AGENTS.md`, Conventions.
