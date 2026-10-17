# Feedback and status — build plan

Plan ID: `FEEDBACK-2026-10`

The Feedback and status category already ships `Alert`, `Badge`, `EmptyState`, `Meter`,
`Progress`, `Skeleton` and `Spinner`. Two components are missing, and each gets its own spec
and its own child workspace.

| Phase | Component | Spec | Folder | Import |
| --- | --- | --- | --- | --- |
| `FB-1` | AnimatedBadge | [animated-badge.md](animated-badge.md) | `src/components/animated-badge/` | `@delacour/react-native-ui/animated-badge` |
| `FB-2` | Marker | [marker.md](marker.md) | `src/components/marker/` | `@delacour/react-native-ui/marker` |

## Build order

The two are independent and build **in parallel**. Neither imports the other, and neither touches
a file the other does — except the shared generated and index files listed below, which are the
only merge conflicts expected.

| Shared file | Conflict resolution on merge |
| --- | --- |
| `packages/react-native-ui/package.json` `exports` | re-run `bun run gen-exports` |
| `apps/playground/src/demos/registry.ts` | re-run `bun run gen-demos` (in `apps/playground`) |
| `packages/react-native-ui/AGENTS.md` **Components** table | keep both rows, alphabetical |
| `apps/playground/src/app/index.tsx` `ListGroup` | keep both rows |
| `packages/cli/src/registry/config.ts` `ITEM_META` | keep both entries |
| `registry/` | re-run `bun --filter delacour run registry:build` |
| `apps/web/content/docs/native/components/meta.json` (if it lists pages) | keep both |

## Dependencies

Both are built from what this package already holds. No new peer dependency, no catalog edit.

| Component | Reuses | From another category? |
| --- | --- | --- |
| AnimatedBadge | `badge.variants.ts` (leaf — the soft paint matrix and `BADGE_FOREGROUND_TOKEN`), `Spinner`, `Icon`, `Text`'s class provider, `useCalmMotion`, Reanimated | No |
| Marker | `Pressable`, `Separator`, `Icon`, `Text`, `useCalmMotion`, Reanimated | No |

**Scoped out — Marker's glyph-masked shimmer.** A highlight band clipped to the glyphs of a line
of text needs a mask: `@react-native-masked-view/masked-view` or Skia text. Neither is a peer of
this package today, and adding one for a single prop fails the catalog rule's cost/benefit. The
spec ships `shimmer` as a UI-thread opacity sweep across the text instead (see marker.md). A
glyph-masked version is a follow-up, recorded there.

## Acceptance (category)

- Both components merged into this branch, each with its folder `AGENTS.md`, a row in the package
  **Components** table, demos, a docs page, a registry entry and a changeset.
- `bun test`, `bun run typecheck`, `bun run check` green on the integrated branch.
