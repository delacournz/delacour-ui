# @delacour/react-native-bottom-sheet

A headless bottom sheet engine for React Native — Gesture Handler for the pans,
Reanimated for the motion, keyboard-controller for the keyboard, teleport for
the portal.

**Token-free by construction.** Every radius, colour and inset arrives as a
`style`. There is no `className` here, no Uniwind, no theme — that is
`@delacour/react-native-ui/bottom-sheet`'s job, and the split is what lets the
same engine be skinned by something else entirely.

```ts
import { BottomSheet } from "@delacour/react-native-bottom-sheet";
import { positionFor } from "@delacour/react-native-bottom-sheet/core";
```

The package is being built in phases (plan `BSHEET`). Today it is `core/` —
every number the sheet computes, as tested pure functions, plus the step
machine — and the React spine over it: state, geometry, animation, the two
pans, layout measurement and the compound `BottomSheet` with `Trigger`,
`Portal` (in place only, no host yet), `Overlay`, `Container`, `Background`,
`Handle`, `Content`, `Close`, `Title` and `Description`. The keyboard and
footer (BSHEET-3), scrollables (BSHEET-4), the teleport portal, host and
registry (BSHEET-5) and steps (BSHEET-6b) are still to come; the shared
values they write are allocated and derived over already, so each lands by
writing a value rather than by re-plumbing the geometry.

## Commands

```bash
bun test                 # the pure core, plus the guard tests below
bun run typecheck
bun run check            # Biome
```

## Height space

The engine has one coordinate system, and it is not `translateY`.

`base` and `height` are **pixels of sheet visible above its resting bottom
line**: `0` is closed, detents ascend, and the highest detent is the largest
number. `translateY = containerHeight − restingBottom − height` is derived from
a height at the moment a view needs it, by `core/geometry/position.ts`, and
nowhere else. A detached sheet rests `restingBottom` above the container's
bottom edge, so its closed position is off-screen and every detent sits that
much higher; nothing above `core/` has to know.

`base` is the only animated value — the keyboard-free height. The keyboard
adds a derived `keyboardLift` on top of it, so the index and the backdrop never
move for a keyboard, only the sheet does.

Every measured shared value starts at `UNMEASURED` (`-1`), and layout is ready
only when every measurement the configuration needs has landed. Until then an
open intent waits rather than animating from a guess.

## The purity rule

**Nothing under `src/core` may import a runtime value from `react`,
`react-native`, `react-native-reanimated`, `react-native-gesture-handler`,
`react-native-worklets`, `react-native-keyboard-controller`,
`react-native-safe-area-context`, `react-native-teleport` or
`react-native-pulsar`, and nothing under it imports from outside it.**
Type-only imports are fine.

React Native ships Flow-typed source that Bun's transpiler cannot parse, so one
such import anywhere under `core/` takes the **entire** test suite down — and
the error names whichever file imported the offender first, not the file that
broke the rule. `src/purity.test.ts` fails first and fails by name.

The consequence is the shape of the package: every number the sheet computes is
a pure function of plain numbers, and everything above `core/` is a thin
translator between shared values and those functions. That is what makes the
footer-on-keyboard proof a test rather than a hope.

## The flat-worklet rule

**A worklet declared at module scope may close over module-scope constants but
never over another function, imported or local.** Any helper it needs is
declared inside its own body.

Module scope is the whole rule. A module-scope worklet that calls another
module-scope worklet binds at import time in source order, and the UI thread
gets `undefined is not a function` — at the moment a finger touches the
handle, on a device, with a stack naming neither function. Four components in
`@delacour/react-native-ui` document having learned this;
`src/flat-worklet.test.ts` means nobody learns it again.

A worklet created **inside a hook** is captured by ordinary closure and may
call whatever it likes, including the module-scope worklets in `core/`. That is
how the pan composes `resistOverDrag` and `selectSnapHeight` without
duplicating them, and it is why the rule is scoped rather than absolute.

## Two exports, not twenty

```jsonc
"exports": {
  ".": "./src/index.ts",        // the React surface
  "./core": "./src/core/index.ts" // the maths
}
```

`./core` is importable with no native module in the module graph at all, which
is what lets `@delacour/react-native-ui` re-export `resolveSheetBottomInset` and
friends without mounting a sheet. Do not split it further; the parts are
mutually referential through the sheet context and cannot be used apart from
their root.

## Conventions

- Contexts are `createContext<T | null>(null)`. `useX()` throws
  `[@delacour/react-native-bottom-sheet] useX outside <BottomSheet>`;
  `useOptionalX()` returns `null`.
- Every component's `displayName` is `DelacourBottomSheet.` followed by its
  path in the public API — `src/display-name.test.ts` checks the source.
- Every rendering part accepts `style` and `ref` (React 19 ref-as-prop).
- No `className` anywhere — `src/no-classname.test.ts`.
- Kebab-case files, tabs, no comments inside JSX.

## What is not here

`GestureHandlerRootView`, `SafeAreaProvider` and `KeyboardProvider`. The
consuming app already has all three; a nested one is dead weight, and a
nested `KeyboardProvider` is a second, disagreeing keyboard. `BottomSheetProvider`
is the only provider this package renders, and the app mounts it.

`@delacour/types`. It is private, and this package publishes, so its `Result`
is copied into `core/result.ts` rather than depended on.

## Files

| Path | What |
| --- | --- |
| `src/core` | Every number the sheet computes — detents, keyboard, footer, geometry, backdrop, intents, haptics, scroll lock, animation defaults and the step machine. Its own `AGENTS.md` indexes it and carries the formulas |
| `src/state` | The shared values, the derived geometry (each formula as a `useDerivedValue`) and the intent queue |
| `src/animation` | `animateTo` / `jumpTo`, the Reanimated config mapping, the settle listeners |
| `src/gesture` | The handle and content pans, and the haptic worklet props |
| `src/layout` | Measuring the frame, the handle and the content into shared values |
| `src/components` | The compound `BottomSheet` and its parts, the three contexts |
| `src/lib` | `Slot`, `mergeProps`, `composeRefs`, `useControllableState` — copied from the skin, minus its class merging |
| `src/index.ts` | The React surface; re-exports `core` |
| `src/purity.test.ts` | The purity rule, enforced against the source |
| `src/flat-worklet.test.ts` | The worklet rule, enforced against the source |
| `src/no-classname.test.ts` | The token-free promise, enforced against the source |
| `src/display-name.test.ts` | The `DelacourBottomSheet.` naming, enforced against the source |
| `src/docs.test.ts` | Every subsystem folder documents itself |

Planned subsystems, each with its own `AGENTS.md` when it lands: `keyboard/`
(BSHEET-3), `scrollable/` (BSHEET-4), `portal/` (BSHEET-5), `steps/`
(BSHEET-6b).

## Verified on the simulator

The BSHEET-2 engine demo (`apps/playground`, Bottom sheet → Engine) on an
iPhone 17 Pro Max simulator: the trigger opens with the mount animation; a
handle swipe reaches the second detent and the handle's accessibility value
reads `Detent 2 of 2`; a swipe back lands on the first; a content pan past the
first detent closes and `onOpenChange(false)` fires; an over-drag past the top
settles back on the highest detent; **a tap on a `TextInput` inside the sheet
focuses it on the first try**, so the overlay `Pressable` written before the
panel does not compete for touches (the plan's first risk, resolved without
the band-above fallback); the overlay and `Close` close; every ref method
lands on its detent; and `close` / `dismiss` / `snapToIndex` on a closed sheet
are no-ops or opens, never a deadlock.
