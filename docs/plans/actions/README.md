# Actions — design specs

Plan ID **ACT-01**. Nine Actions components are missing from `@delacour/react-native-ui`, and this
folder specs each one. Each spec stands alone: an agent with no other context can pick one up and
build it.

Every spec describes behaviour by what it does. Write no outside product name, URL or comparison
anywhere in the repo: code, comments, docs, changesets, commits or branch names.

## Index

| Phase ID | Component | Spec | New folder | Depends on | Build wave |
| --- | --- | --- | --- | --- | --- |
| ACT-01-P1 | Button group (finish) | [button-group.md](button-group.md) | none (extends `button/`) | — | 1 |
| ACT-01-P2 | ProgressButton | [progress-button.md](progress-button.md) | `progress-button/` | — | 1 |
| ACT-01-P3 | SlideButton | [slide-button.md](slide-button.md) | `slide-button/` | — | 1 |
| ACT-01-P4 | Swipe | [swipe.md](swipe.md) | `swipe/` | — | 1 |
| ACT-01-P5 | StackCard | [stack-card.md](stack-card.md) | `stack-card/` | — | 1 |
| ACT-01-P6 | Fab | [fab.md](fab.md) | `fab/` | — | 1 |
| ACT-01-P7 | Menu | [menu.md](menu.md) | `menu/` | its own anchored panel (see below) | 1 |
| ACT-01-P8 | SelectionMode | [selection-mode.md](selection-mode.md) | `selection-mode/` | — | 1 |
| ACT-01-P9 | ContextMenu | [context-menu.md](context-menu.md) | `context-menu/` | **Menu (P7)** | 2: starts after P7 merges into the category branch |

Wave 1 runs in parallel, with one child worktree per component, each branched from the category
branch. Wave 2 (ContextMenu) branches from the category branch **after** Menu has merged into it,
because ContextMenu renders Menu's rows and panel rather than a copy of them.

## Cross-category dependencies

| Need | Owner category | Decision |
| --- | --- | --- |
| Anchored floating panel (popover) for Menu / ContextMenu | Overlays (Popover, not merged) | **Build a minimal one inside `menu/`.** The panel is a transparent RN `Modal` positioned from the trigger's `measureInWindow`. Placement, flip and clamp live in one pure resolver, `resolveMenuPlacement`, in `menu.variants.ts`. Popover can adopt that resolver when Overlays lands, then Menu moves onto Popover in a follow-up. Do not import from the Overlays branch. |
| Bottom-sheet presentation of Menu / ContextMenu / SelectionMode | Overlays (BottomSheet is merged, but its engine is an **optional peer**) | **Out of scope for v1.** Importing `../bottom-sheet` would force every Menu or SelectionMode consumer to resolve the optional engine and `react-native-teleport`. SelectionMode's demo shows the caller composing it inside `BottomSheet` themselves. A `presentation="bottom-sheet"` prop is a follow-up. |
| Liquid-glass material (Fab) | none (needs `expo-glass-effect`, not in the catalog) | **Out of scope.** It would need a new uncatalogued native peer. |
| Native platform menus (Fab `layout="native"`) | none (needs `@expo/ui`) | **Out of scope.** Same reason. |
| RTL subtree switch | Layout (Direction, not built) | Read `I18nManager.isRTL` only. Swipe and SlideButton flip with it. |
| Toast for undo | Overlays | Not needed. Demos use local state. |

No new peer dependency is added by any spec. Everything is built from what the package already
peers on: Reanimated, Gesture Handler, Worklets, Pulsar (haptics via `playHaptic` from
`pressable/`), react-native-svg, and safe-area-context.

## Conventions every child must follow

Read the root `AGENTS.md` and `packages/react-native-ui/AGENTS.md` first, then the per-component
`AGENTS.md` that the spec names as its closest relative.

- Use pattern B: a compound root with `Object.assign` and a `function` root. One file per part,
  plus `{name}.context.tsx`, `{name}.types.ts` (only types shared by two or more parts) and
  `{name}.variants.ts`, which holds the slotted `tv()` from `../../lib/tv` and the **pure
  resolvers**.
- **TDD.** Write `{name}.variants.test.ts` first for every pure resolver the spec lists. Run
  `bun test packages/react-native-ui/src/components/{name}` after each change.
- Every component and part gets a `DelacourUI.`-prefixed `displayName`.
- No `any`. Use discriminated unions. Booleans are `is*` (`isDisabled`, `isOpen`). Use the
  `defaultX` + `onXChange` pairs through `useControllableState`.
- Build interaction on `Pressable` or Gesture Handler. Worklets cross to JS with `scheduleOnRN`.
  A worklet body must be self-contained: no module-scope helpers.
- Haptics: `playHaptic` from `../pressable/pressable`, with a `haptic?: false | HapticFeedback`
  prop. Haptics are off by default.
- Motion: springs and timings on the UI thread. Under `useReducedMotion()` a movement becomes a
  short timing or a fade, and **never disappears** when the motion *is* the information.
  Decorative loops read `useCalmMotion()`.
- Colours come from semantic tokens only (`bg-primary`, `text-destructive-foreground`,
  `bg-overlay`). Colour values come from `useThemeColor`. Sizes come from semantic tokens where
  one exists (`h-button-md`, `size-icon-md`). Text colour goes on the `Text`, never on its parent.
- No comments inside JSX.
- Central Icons only, via `../../icons/central`.
- Files are kebab-case.

### Delivery checklist (per component)

1. `packages/react-native-ui/src/components/{name}/`: source, `index.ts`, tests, and an `AGENTS.md`
   with a file map, the design bullets (bold claim, then the failure it prevents) and what is out
   of scope.
2. Add a row to the **Components** table in `packages/react-native-ui/AGENTS.md`.
3. `bun run gen-exports` (in `packages/react-native-ui`).
4. Add `ITEM_META` (and any `PACKAGE_INSTALL`) entry in `packages/cli/src/registry/config.ts`, then
   `bun --filter delacour run registry:build` and commit `registry/`.
5. Playground: write `apps/playground/src/demos/{name}/*.tsx` + `index.ts`, the route
   `apps/playground/src/app/(components)/{name}.tsx` and a row in `src/app/index.tsx`. Then
   `cd apps/playground && bun run gen-demos`. Mark 4–6 demos `capture`, one of them `hero`, per
   `apps/playground/src/demos/AGENTS.md`.
6. Docs: `apps/web/content/docs/native/components/{name}.mdx`, modelled on `toggle-button.mdx`,
   plus an entry under `---Actions---` in that folder's `meta.json`.
7. Changeset: `bun run changeset`, **minor** on `@delacour/react-native-ui` for a new component
   and patch for a fix.
8. Run `bun test`, `bun run typecheck` and `bun run check`. All must pass.
9. Simulator: `warden claim ios --json`, install via warden, drive with `agent-device` against the
   playground route, then `warden release`. If no simulator is free, skip this step and say so in
   the commit body. Do **not** run `bun run previews` unless you hold a simulator.
10. Make small commits as you go: `<gitmoji> <type>(react-native-ui): <desc>`. Add no trailers.
    No push, no PR.

## Merge plan (category lead)

Children merge into `feature/cat-actions` with `git merge --no-ff`, one at a time. Conflicts are
expected only in shared, generated or indexed files:

- `packages/react-native-ui/package.json` `exports`: re-run `bun run gen-exports`
- `apps/playground/src/demos/registry.ts`: re-run `bun run gen-demos`
- `registry/**`: re-run `bun --filter delacour run registry:build`
- `packages/react-native-ui/AGENTS.md` table, `packages/cli/src/registry/config.ts`,
  `apps/web/.../meta.json` and `apps/playground/src/app/index.tsx`: keep both sides' rows and
  re-sort them alphabetically.

After each merge, run `bun test`, `bun run typecheck` and `bun run check`.
