# core

Every number the sheet computes, and nothing that renders.

## The rule

**No runtime import of `react`, `react-native`, `react-native-reanimated`,
`react-native-gesture-handler`, `react-native-worklets`,
`react-native-keyboard-controller`, `react-native-safe-area-context`,
`react-native-teleport` or `react-native-pulsar`.** Type-only imports are
fine. Nothing here imports from outside `core/` either — a `../` would pull a
hook or a component down into the maths, and into `bun test` with it.

`src/purity.test.ts` enforces both. See the package `AGENTS.md` for why the
failure mode makes a test necessary rather than a convention sufficient.

## Height space

Every value here is a **height**: pixels of sheet visible above its resting
bottom line. `0` is closed, detents ascend, `-1` (`UNMEASURED`) is a
measurement that has not happened. `translateY` is derived from a height only
at the moment a view needs it, by `geometry/position.ts`, and nowhere else.

## Files

| Path | What |
| --- | --- |
| `sheet.types.ts` | `DetentSpec`, the keyboard behaviours, `AnimationSource`, `SheetIntent`, the numeric enums and the two sentinels |
| `result.ts` | The house `Result` union, copied from the private `@delacour/types` |
| `detents/normalize-detents.ts` | `parseDetent` (JS, a `Result`) and W `normalizeDetents(spec, available)` — ascending, unique, clamped, invalid entries skipped |
| `detents/dynamic-detent.ts` | W `dynamicDetent` — handle + content + footer content + band once, capped |
| `detents/index-for-height.ts` | W `indexForHeight` / `heightForIndex` — piecewise-linear over `[closed, …detents]`, clamped |
| `detents/select-snap-height.ts` | W `selectSnapHeight` — nearest candidate to `height + projection · velocity`; closes only when given a closed height |
| `detents/over-drag.ts` | W `resistOverDrag` — slope 1 at the edge, square-root beyond; factor 0 clamps |
| `detents/sheet-state.ts` | W `sheetState` — closed / opened / extended / overExtended / fill |
| `keyboard/keyboard-lift.ts` | W `keyboardInContainer`, W `keyboardLift` — the lift, band and gap subtracted in step with progress |
| `keyboard/keyboard-owner.ts` | W `isInputInsideSheet` — the `keyboardScope: "inside"` geometry test |
| `keyboard/content-area.ts` | W `contentArea` — what the body may fill, never negative |
| `keyboard/container-layout-guard.ts` | `acceptContainerLayout` — refuses Android's adjustResize double-count |
| `keyboard/keyboard-reset-guard.ts` | W `shouldResetKeyboardAnimation` — the stale keyboard-controller guard, ported from `react-native-ui` |
| `footer/footer-top.ts` | W `footerTop` — constant across a keyboard animation; the sweep test proves it |
| `footer/bottom-band.ts` | W `bottomBand`, W `bandNow`, W `footerHeight` |
| `footer/body-inset.ts` | W `bodyInset` — what trails the body, footer or band; W `bodyClip` — the body's clipping box, held to the footer's live top edge; `scrollContentHeight` — a scrollable's content size less its trailing spacer |
| `footer/sheet-insets.ts` | `resolveSheetBottomInset` (what the engine reserves under static content), `resolveSheetScrollEndPadding` (what a skin adds at the end of scroll content — the `footerGap`, never the band) — re-exported by the skin |
| `geometry/closed-height.ts` | W `restingBottom`, W `closedHeight`, W `availableHeight` |
| `geometry/position.ts` | W `positionFor` — height to `translateY`, the only conversion |
| `geometry/clamp-height.ts` | W `clampHeight` — `NaN` collapses to closed |
| `geometry/detached-frame.ts` | `resolveDetached`, `DETACHED_DEFAULTS`, W `detachedFrame` — left, width, resting bottom |
| `backdrop/backdrop-opacity.ts` | W `backdropOpacity`, W `backdropInteractive` |
| `intent/resolve-intent.ts` | W `resolveIntent(state, intent)` — `wait` / `animate` / `jump` / `null` |
| `intent/layout-ready.ts` | W `isLayoutReady` |
| `haptic/crossed-detent.ts` | W `crossedDetent` (boolean), W `detentUnder` (index) |
| `scroll/scroll-lock.ts` | W `shouldLockScroll`, W `contentPanDrivesSheet` |
| `scroll/scroll-pan.ts` | W `listDragHeight` — the start offset as a budget the finger spends before the sheet moves; W `listOwnsRelease`; W `scrollLockTarget` |
| `animation/select-animation.ts` | `selectAnimation`, `IOS_SPRING`, `ANDROID_TIMING` — platform defaults as data, easing by name |

W marks a module-scope `"worklet"`; each is flat (see the package `AGENTS.md`)
and re-implements the little it needs of its siblings inline. Every export
goes through `index.ts` by name.

## Formulas

With `C` the container height, `inset` the safe-area bottom, `kb` the owned
keyboard within the container (positive) and `p` keyboard-controller's
`progress`:

```
restingBottom = detached ? bottomOffset + inset : 0          closedHeight = −restingBottom
available     = C − restingBottom                            maxHeight = available
band          = detached ? 0 : inset                         bandNow = band · (1 − p)
footerHeight  = hasFooter ? footerContent + bandNow : 0
dynamicDetent = min(handle + content + (hasFooter ? footerContent : 0) + band, maxDynamicContentSize, available)
detents       = sortAsc(unique(normalize(spec, available) ∪ {dynamicDetent if dynamicSizing}))
keyboardLift  = behavior ∈ {interactive, extend} ? max(0, kb − band · p − (detached ? restingBottom : 0)) : 0
height        = clamp(base + keyboardLift, closedHeight, maxHeight)
translateY    = C − restingBottom − height
index         = piecewise(base, [closedHeight, …detents] → [−1, 0, 1, …])      // base, never height
contentArea   = max(0, min(maxHeight, highest + keyboardLift) − handle − footerHeight − kb − (hasFooter ? 0 : bandNow))
footerTop     = max(0, height − kb − footerContent − bandNow)
bodyInset     = hasFooter ? footerHeight : bandNow
bodyClip      = hasFooter ? max(0, min(contentArea + bodyInset, height − kb − handle − bodyInset)) : contentArea + bodyInset
backdrop      = index ≥ appearsOn ? opacity : index ≤ disappearsOn ? 0 : linear
```

The footer proof: `footerTop = base + kb − band·p − kb − footerContent − band + band·p = base − footerContent − band`,
independent of `p`. `footer/footer-top.test.ts` sweeps it in twenty steps.

The body — `Content`'s layout box, a scrollable's viewport — is laid out
`contentArea + bodyInset` tall, to the sheet's bottom line, and reserves
`bodyInset` at its end as a spacer inside itself, so a list's rows run under
the footer or the band and its last row can still be scrolled clear of them.
`bodyClip` is what of that may show: without a footer all of it, so a sheet
slides as one body; under a footer only what is above the footer's live top
edge — `height − kb − handle − footerHeight`, which is `footerTop − handle` —
so while the sheet is dragged below its detent and the footer holds the
screen's bottom edge, no line of the body is drawn under it. On the detent the
clip is exactly `contentArea`. A scrollable's `contentHeight` is
`scrollContentHeight(contentSize, spacer)`: the spacer is the footer and the
band, which `dynamicDetent` adds once already.

Two deviations from the plan's signatures, both on purpose:

- `resolveIntent` returns `{ action } | null` rather than `number | null`,
  because `forceClose` needs a jump the caller can tell from an animate, and
  an open before layout needs a *wait* the caller can tell from a no-op.
- `crossedDetent` returns a boolean and `detentUnder` the index, rather than
  one function doing both — a number that means "unchanged" when it equals its
  input is a comparison the caller has to make anyway, spelled worse.

## Design

- **Pure means testable, and testable is the point.** `bun test` cannot render
  a React Native component, so anything worth asserting has to live here. A
  decision that looks like it belongs in a `.tsx` because it is only used once
  is only used once *today*. Put it here.

- **A `"worklet"` directive is a string, not an import.** It costs a module
  nothing in purity, which is how the per-frame maths stays testable while
  running on the UI thread.

- **Enums are numbers.** A shared value holding a string serialises on every
  write, and `gestureSource` is written every frame of a pan.

- **A degenerate input returns a finite number, never `NaN`.** One `NaN`
  written into `base` freezes a sheet permanently, with nothing on screen to
  say why.

## Machine

`machine/` is the typed multi-step engine `BottomSheet.Steps` runs on, and it
is deliberately nothing more than a config and a reducer.

| Path | What |
| --- | --- |
| `machine/machine.types.ts` | `SheetMachineConfig`, `SheetStateNode`, `SheetMachineSnapshot`, `SheetTransitionError`, `SheetMachine` |
| `machine/transition.ts` | `transition(states, snapshot, event)` — the one step, as a `Result` |
| `machine/define-sheet-machine.ts` | `defineSheetMachine(config)` — `initial`, `transition`, `can`, `steps`, `directionOf`, `nodeOf` |
| `machine/step-transition.ts` | `stepFrame(transition, role, direction, progress, width)` — the opacity and offset of a step mid-change, for `crossfade` / `slide` / `none`; `stepOverride(node)` — the `snapPoints` / `dismissible` a step asks of the root |

- **A snapshot is a value.** `{ value, context, history }` in, a new one out;
  `assign` returns a fresh context and the incoming snapshot is never touched.
  That is what makes `useSheetMachine` a `useReducer` and lets a test replay a
  whole form in three lines.
- **A refusal is data.** `transition` returns `err({ code: "no-transition" })`
  or `err({ code: "guard-rejected", from, to })` rather than throwing, and
  `can` is just `transition(...).success` — which is how a Next button is
  disabled while a guard says no.
- **A self-target edits in place.** `EDIT: { target: "details", assign }`
  keeps `value`, updates `context` and does not push `history`; only a change
  of step appends the step it left.
- **`steps` is declaration order**, and `directionOf(from, to)` reads the
  target's explicit `direction` first, else compares indices. Per-step
  `snapPoints` and `dismissible` are surfaced untouched through `nodeOf` for
  the nested config override in `steps/`.
- **`on` narrows per event type.** The handler under `on.EDIT` sees
  `Extract<E, { type: "EDIT" }>`, so `assign` can read `event.field` without a
  cast. `transition.ts` widens back to `E` once, at dispatch, where the type
  has already chosen the handler.
- **Anything with the same shape may stand in.** An XState adapter is any
  object satisfying `SheetMachine`; nothing here is checked by identity.
