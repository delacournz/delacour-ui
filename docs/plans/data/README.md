# Data components — plan DATA-01

Seven components for `@delacour/react-native-ui`'s data category, each specified in its own
file and built in its own child branch off `feature/cat-data`, then merged back here.

| ID | Component | Spec | Subpath | New peer | Size |
| --- | --- | --- | --- | --- | --- |
| DATA-01-P1 | Table | [table.md](table.md) | `/table` | — | M |
| DATA-01-P2 | Countdown | [countdown.md](countdown.md) | `/countdown` | — | S |
| DATA-01-P3 | Timeline | [timeline.md](timeline.md) | `/timeline` | — | M |
| DATA-01-P4 | Leaderboard | [leaderboard.md](leaderboard.md) | `/leaderboard` | — | M |
| DATA-01-P5 | Planner | [planner.md](planner.md) | `/planner` | — | L |
| DATA-01-P6 | Flow | [flow.md](flow.md) | `/flow` | — | XL |
| DATA-01-P7 | Map | [map.md](map.md) | `/map` | `react-native-maps` (optional, catalogued) | L |

## Build and merge order

All seven build in parallel; they share no code. They **merge** in the order above — smallest
surface first, so the shared generated files (below) settle early and the large branches rebase
onto a stable base.

```
table ─┐
countdown ─┤
timeline ──┤ independent, merge first
leaderboard┘
planner ──── uses BottomSheet (exists) for its day details
flow ─────── uses react-native-svg + Reanimated + Gesture Handler (all existing peers)
map ──────── the only new peer; merge last
```

## Cross-category dependencies

The rule: never import from another category's unmerged branch. Each case below is resolved
inside this category.

| Need | Owner category | Resolution |
| --- | --- | --- |
| Planner day details in a dialog | Overlays (Dialog — missing) | Use the existing `BottomSheet` (`@delacour/react-native-bottom-sheet` optional peer). Swap to Dialog later only if the Overlays category ships one and it reads better. |
| Planner month math / grid | Forms (Calendar — missing) | Planner owns pure month math in `planner.variants.ts`. When a Calendar lands, extract the shared math into `src/lib/` in a follow-up; do not wait on it. |
| Countdown digit roll | — (no animated-number primitive exists) | Internal `CountdownDigit` part. Not exported. |
| Table horizontal overflow fade | — (no scroll-fade primitive exists) | Internal edge fade with `expo-linear-gradient` (existing peer). Not exported. |
| Flow / Map zoom buttons | Actions (Button — exists) | Use `Button` `size="icon-sm"` with Central Icons. |
| Map popup / Flow controls float | Overlays (Popover — missing) | Absolutely positioned `Surface`; no popover needed. |
| Leaderboard row media | Display (Avatar — exists) | Caller passes media via a render slot; Leaderboard does not import Avatar. |

## Shared files every branch touches (merge hot spots)

Each child edits these; the integrator resolves conflicts by **keeping both sides** and, for
generated files, **re-running the generator** rather than hand-merging:

| File | How to resolve |
| --- | --- |
| `packages/react-native-ui/package.json` `exports` | `cd packages/react-native-ui && bun run gen-exports` |
| `apps/playground/src/demos/registry.ts` | `cd apps/playground && bun run gen-demos` |
| `packages/cli/registry/**` | `bun --filter delacour run registry:build` |
| `packages/react-native-ui/AGENTS.md` Components table | keep both rows, alphabetical |
| `packages/cli/src/registry/config.ts` `ITEM_META` / `PACKAGE_INSTALL` | keep both entries |
| `apps/web/content/docs/native/components/meta.json` | keep both, under `---Data Display---` |
| `apps/playground/src/app/index.tsx` ListGroup rows | keep both, alphabetical in its section |
| `.changeset/*.md` | distinct files, no conflict |

## Conventions every spec assumes

Read once; the specs do not repeat them.

1. **Read first**: root `AGENTS.md`, `packages/react-native-ui/AGENTS.md`, the AGENTS.md of each
   component the spec names as "reuses", `apps/playground/src/demos/AGENTS.md`, `apps/web/AGENTS.md`.
2. **Folder** `packages/react-native-ui/src/components/<name>/` with: `index.ts`, `<name>.tsx` (root +
   `Object.assign` — root is a `function` declaration, doc comment on the const), one file per part,
   `<name>.context.tsx` leaf, `<name>.types.ts` (shared types only), `<name>.variants.ts` (slotted
   `tv()` from `../../lib/tv` + every pure resolver, **no RN imports**), `<name>.variants.test.ts`,
   `AGENTS.md` (file map, design bullets "bold claim → failure it prevents").
3. **Every component and part** gets `displayName = "DelacourUI.<Dotted.Path>"`.
4. **TDD**: write `<name>.variants.test.ts` (and any `*.test.ts` for pure helpers) first; `bun test <path>`
   after each change.
5. **No `any`**; discriminated unions; no comments inside JSX; Central Icons only; `cn()` for caller
   `className`; text colour on the `Text`; semantic tokens only, never raw palette or `dark:`.
6. **Interaction on `Pressable`** (`haptic` prop for feedback). Motion through Reanimated; any
   decorative loop reads `useCalmMotion()`; entering motion honours `useReducedMotion()`.
7. **Controlled + uncontrolled** state through `useControllableState`.
8. Register: Components-table row in `packages/react-native-ui/AGENTS.md`; `ITEM_META` (+
   `PACKAGE_INSTALL` for any new npm import) in `packages/cli/src/registry/config.ts`; then
   `bun run gen-exports` (in the package) and `bun --filter delacour run registry:build`.
9. **Playground**: `apps/playground/src/demos/<name>/*.tsx` + ordered `index.ts`, route
   `apps/playground/src/app/(components)/<name>.tsx` (six-line `DemoGallery` shell), row on
   `src/app/index.tsx`, `bun run gen-demos`. Mark 4–6 demos `capture`, one `hero`. `testID` anything
   a flow touches.
10. **Docs**: `apps/web/content/docs/native/components/<name>.mdx`, listed under `---Data Display---`
    in that folder's `meta.json`. Match the shape of `kpi.mdx` / `steps.mdx`.
11. **Changeset**: `bun run changeset` → `@delacour/react-native-ui` **minor**, one line describing
    what the component does.
12. **Naming rule**: describe behaviour only. Never name, link or allude to any outside product or
    library the design was compared against.
13. **Verify**: `bun test`, `bun run typecheck`, `bun run check` from the repo root before the last
    commit. Simulator checks through `warden claim ios --json` + agent-device only.

## Open questions (for the maintainer)

1. Map basemap engine — **a.** `react-native-maps` (SDK-bundled, catalogued; Apple/Google tiles,
   light/dark follows theme, Android styled from tokens) *(chosen)* · **b.** MapLibre (fully
   token-drawn basemap, but a non-SDK native module and a third-party tile licence) · **c.** defer Map.
2. Planner details — **a.** BottomSheet now *(chosen)* · **b.** wait for an Overlays Dialog.
3. Flow renderer — **a.** react-native-svg + Reanimated animated props *(chosen)* · **b.** Skia
   (new direct peer on this package).
