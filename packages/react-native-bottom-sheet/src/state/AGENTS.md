# state

The shared values a sheet owns, the numbers derived from them, and the intent
queue that moves them.

## Files

| Path | What |
| --- | --- |
| `state.types.ts` | `SheetSharedState` (the raw shared values), `SheetGeometry` (the derived ones), `SheetWorkletConfig` (the props a worklet reads), `ANIM_STATUS` |
| `use-sheet-state.ts` | Allocates the raw values once per sheet; mirrors `snapPoints` and the config into them, keyed on serialisation rather than identity |
| `use-detents.ts` | `detents` — `normalizeDetents` plus the dynamic detent once handle and content have measured |
| `use-sheet-geometry.ts` | Every formula in `core/AGENTS.md` as a `useDerivedValue`, in dependency order |
| `use-sheet-intents.ts` | The JS-thread `dispatch`, the reaction that resolves an intent on the UI thread, and the reaction that follows a detent change or a container resize |

## The model

`base` is the only value an animation or a gesture writes. Everything a view
reads — `height`, `position`, `index`, `contentArea` — is derived from it and
from the measurements, on the UI thread, by the core's pure functions. Nothing
in this folder contains a formula; it contains `useDerivedValue(() =>
coreFunction(...))` and nothing else, which is what keeps the numbers
testable.

Measurements start at `UNMEASURED` (`-1`) and go back to it when the part that
reported them unmounts (`layout/`). `layoutReady` is derived from them, and an
`open` intent waits on it.

The keyboard values — `keyboardHeight`, `keyboardProgress`, `keyboardOwned` —
are allocated here and every keyboard term in the geometry is a real
derivation over them. BSHEET-3 writes them; until then they are `0`, `0` and
`false`, and every keyboard term is inert. `footerContentHeight` is the same:
allocated, derived over, and unmeasured until BSHEET-3 mounts a footer and the
root sets `hasFooter`.

## Intents

`dispatch({ kind: "open" })` writes `state.intent`; a reaction keyed on the
intent's `id` and on `layoutReady` runs `resolveIntent` from the core and calls
`animateTo` or `jumpTo`. The JS thread never animates and never reads a
measurement to decide whether it may.

The resolver is told the sheet's **effective** index: the settled one, or the
running animation's target. Without that a `close()` during the open animation
would see a closed sheet, resolve to nothing, and let the sheet finish opening.

The first open a sheet resolves is reported as `"mount"` and, with
`animateOnMount: false`, jumps. `mountPending` is that flag.

## Detents moving under a settled sheet

The second reaction watches the detent list and the container height. When
the list changes with the sheet idle and open, the sheet animates to the same
index in the new list — dynamic content growing, a `snapPoints` change. When
the container changed, it jumps there instead: a rotation is not something to
animate through. Neither runs while a gesture or an animation owns `base`.

## Why the config is one shared value

A worklet that captured a dozen boolean props would rebuild every time one of
them changed, and a gesture captures the pan handlers. `config` is one object
written by one effect, and a worklet reads `state.config.value.x` at the
moment it needs it.
