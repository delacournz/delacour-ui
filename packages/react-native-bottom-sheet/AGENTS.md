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
`Portal` (teleported to the nearest host, in place without a provider), `Overlay`, `Container`, `Background`,
`Handle`, `Content`, `Close`, `Title` and `Description`; the keyboard and
footer (BSHEET-3), scrollables (BSHEET-4), the teleport portal, host and
registry (BSHEET-5) and the multi-step body `Steps` / `Step` over the
`core/machine` step machine (BSHEET-6b). Each landed by writing a shared
value the geometry already derived over rather than by re-plumbing it.

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
| `src/keyboard` | keyboard-controller's values into the sheet's, who owns the keyboard, the `extend` / `fillParent` snaps, `useBottomSheetTextInput`, the stale-keyboard guard |
| `src/layout` | Measuring the frame, the handle and the content into shared values |
| `src/scrollable` | `BottomSheet.ScrollView` / `FlatList` / `SectionList` and `createBottomSheetScrollable` — the scroll lock, the drag budget, content size as the dynamic detent |
| `src/portal` | `BottomSheetProvider`, `BottomSheet.Host`, the nearest-host context and the registry that gives every open sheet its `zIndex`, `replace` and `dismissAll` |
| `src/steps` | `BottomSheet.Steps` / `Step`, `useSheetMachine`, `useSheetStep` — a body whose contents follow a machine and whose height glides between them |
| `src/components` | The compound `BottomSheet` and its parts, the three contexts |
| `src/lib` | `Slot`, `mergeProps`, `composeRefs`, `useControllableState` — copied from the skin, minus its class merging |
| `src/index.ts` | The React surface; re-exports `core` |
| `src/purity.test.ts` | The purity rule, enforced against the source |
| `src/flat-worklet.test.ts` | The worklet rule, enforced against the source |
| `src/no-classname.test.ts` | The token-free promise, enforced against the source |
| `src/display-name.test.ts` | The `DelacourBottomSheet.` naming, enforced against the source |
| `src/docs.test.ts` | Every subsystem folder documents itself |

Every subsystem above carries its own `AGENTS.md`; `src/docs.test.ts` fails by
name for one that does not.

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

The BSHEET-3 keyboard and footer demos, same simulator: a sheet sized to its
content with three fields and a sticky `Footer` opens with the footer's
buttons ending exactly `bottomInset` above the screen's edge; a tap on a
plain `TextInput` lifts the sheet by the keyboard's height less that band and
the footer's padded bottom edge lands on the keyboard's top edge, to the
point; a tap on the `BottomSheet.TextInput` and on the hook-registered field
moves focus with no second resize; the return key drops the keyboard and the
sheet settles back on its detent with the footer above the home indicator
again; `extend` snaps to the second detent on focus (`onIndexChange` reports
`keyboard`) and restores the first on dismiss; `fillParent` takes the sheet to
its top inset and the body shrinks to the space above the keyboard; `none`
leaves the sheet where it was under the keyboard; and a footer button press
closes the sheet. One bug was found and fixed on the device: the footer's
`hasFooter` flag reached the config a tick after the handle and content had
measured, so the first open resolved on a detent with no footer in it and the
footer covered the last field — hence the `useLayoutEffect` in
`bottom-sheet-footer.tsx`.

The BSHEET-5 portal and detached demos, on a `BSHEET-5 iPhone 17` simulator:
a `Portal` with no `inline` under the playground's `BottomSheetProvider` draws
over the navigator's header and the demo pager, and a `createContext` value
provided around the trigger reads `from the trigger's screen` inside the
sheet — teleport moved the native view and left the React tree alone; a
second sheet opened from inside the first lands above it, and its own overlay
dims the first; `stackBehavior="replace"` on a third closes the first before
the third opens; `dismissAll` from `useBottomSheetRegistry()` closes both of a
stack; a sheet written inside a native `Modal` wrapped in
`<BottomSheet.Host name="modal">` draws over the modal, not behind it; a
`detached` card sits 16 in from each side and 50 above the bottom (16 plus a
34 inset), rounds all four corners, is fully off-screen when closed, and a
tap in the gap under it closes it; `detached={{ horizontalMargin: 24,
bottomOffset: 32 }}` moves it accordingly. Two things were found and fixed on
the device: an effect keyed on the registry's context object presented,
re-rendered, dismissed and presented without end (`Maximum update depth
exceeded`) until it was keyed on the two stable callbacks instead; and the
frame-tall panel painted the card's surface to the screen's bottom edge and
swallowed the gap's taps, so a detached `Background` is now sized by the
geometry's `surfaceHeight` — the sheet's height between its detents, the
nearest detent's beyond them — the panel is `box-none`, and the body is
clamped to what the surface shows. A handle drag down from the detent then
moves the whole card as one rigid body: the top corners, the copy, the button
and the bottom corners slide through the gap together and off the screen,
nothing shrinking onto the resting line. Android's back button cannot be pressed on an iOS
simulator; the registry's `isTop` is unit-tested instead.

The BSHEET-4 scrollables demos, on a `BSHEET-4 iPhone 17` simulator (iOS 26.5):
in a `ScrollView` behind `["45%", "90%"]`, a swipe up inside the list at the
low detent moves the sheet to `Detent 2 of 2` with the list still at offset
`0` and no scroll indicator drawn; the same swipe at the top scrolls the list
(offset `204`, indicator at 29%) with the sheet still on the top detent; a
slow drag down from offset `255` scrolls the list back to `68` with the sheet
unmoved, a second spends the rest and the sheet follows once the list is at
`0`; a fling down from the top lands on detent 1 with the list held at exactly
`0`; a fling down with the list scrolled scrolls the list and never snaps the
sheet (the release is the list's). A `FlatList` of 200 rows flings to row 57
in three swipes with the sheet on the top detent. A `ScrollView` with no
`snapPoints` sizes to six rows, grows to the 420-point `maxDynamicContentSize`
cap for forty and scrolls inside it. A `SectionList` under a sticky `Footer`
scrolls to its last row fully above the buttons, section headers stick, and
the footer's button closes the sheet. Two things were found on the device and
fixed: subtracting the list's *live* offset from a content pan raced the pan
by a frame — the sheet dipped a pixel, the lock engaged and the list froze —
so the pan spends the offset the list *began* with instead (`listDragHeight`);
and the lock took whatever offset the last scroll event had reported (9
points) when a content pan left the top, so a content pan now locks at `0`.

The BSHEET-6b steps demos, on a `BSHEET-6 iPhone 17` simulator (iOS 26.5):
the three-step form opens on details with **Next** disabled; the keyboard
lifts the sheet with the sticky footer on the keyboard's top edge as before;
typing a name and a valid email unlocks **Next** live, and clearing the name
locks it again; **Next** crossfades to confirm and the panel's top edge
glides down 186 px over thirteen frames at 30 fps with monotonic,
decelerating deltas (43, 41, 33, 24, 17, 11, 6, 5, 2, 2, 1, 0, 1) — no
single-frame jump — measured from a screen recording; on confirm
(`dismissible: false`) a tap on the scrim does nothing and a pan down
rubber-bands 94 px and springs back; **Back** restores details with the
fields intact; **Submit** lands on success at exactly 35% of the available
height (`snapPoints: ["35%"]` with dynamic sizing off for that step); **Done**
closes and the next open shows details with empty fields, so `resetOnClose`
ran from the unmount path. The per-step demo cycles dynamic → 75% → 50% →
dynamic on one button. The slide demo moves page one's button out to the
left as page two arrives from the right, and page three arrives taller with
the sheet growing to meet it. One bug was found on the device: the
playground runs the React Compiler, which memoised `can({ type: "NEXT" })`
on the identity of `can`, and a `can` that was stable across snapshots and
read a ref answered from the render it was first called in — the footer's
**Next** never unlocked while the readout above the sheet said it should.
`can` and `matches` are now rebuilt with the snapshot they close over. A
second problem was designed around before it shipped: a `Footer` written
beside the body is not a descendant of `Steps`, so `useSheetStep` there read
a controller registered a render late and threw on the first pass; `Steps`
now writes the controller into a root ref during its own render, which a
footer rendered after it in the same pass already sees.
