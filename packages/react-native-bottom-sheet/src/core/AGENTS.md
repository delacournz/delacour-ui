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
| `geometry/position.ts` | Height to `translateY` — the one flat worklet so far |

BSHEET-1 fills this folder: `detents/`, `keyboard/`, `footer/`, `geometry/`,
`backdrop/`, `intent/`, `haptic/`, `scroll/`, `animation/` and `machine/`, one
tested function per file. Add each to `index.ts` and to the table above.

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
