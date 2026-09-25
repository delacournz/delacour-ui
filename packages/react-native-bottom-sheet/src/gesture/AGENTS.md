# gesture

The two pans that drive a sheet, and the haptic hooks they fire.

## Files

| Path | What |
| --- | --- |
| `gesture.types.ts` | `SheetPans` (handle and content), `SheetHaptics` (the three worklet props), `SheetPanOptions`, the activation constants |
| `use-sheet-pan.ts` | `useSheetPan(state, geometry, animateTo, options)` — both pans from one set of hook-scope handlers |

## The handlers

`onStart` cancels the animation that owns `base`, records the source (handle
or content), where the drag began and which detent was under it.

`onChange` turns the finger's travel into a height — `startBase −
translationY`, less the scrollable's offset for a content pan once BSHEET-4
wires one — rubber-banded by `resistOverDrag` past the lowest and highest
detent and never above the container. The lowest is the closed height when
`enablePanDownToClose`, else the first detent. `crossedDetent` decides the
detent haptic; entering the rubber band fires the over-drag haptic once.

`onFinalize`, not `onEnd`: a gesture that fails after activating never fires
`onEnd`, and the sheet would be stranded between detents. `selectSnapHeight`
projects the release velocity a fifth of a second ahead and picks the nearest
candidate, closing only when the pan may close, and `animateTo` gets half the
velocity in height space — upward positive, so `−velocityY`.

## Activation

The content pan waits six points of vertical travel before it claims a touch
and gives up after twelve horizontal, so a tap lands on the button or the
field under it and a horizontal pager inside the sheet keeps its swipe. The
handle pan claims immediately. Both keep running when the finger leaves the
view. Scrollables (BSHEET-4) wrap their native gesture in
`simultaneousWithExternalGesture(pans.content)`.

## Per-gesture memory

Where the drag began, the detent last under it and whether it is over-dragging
live in shared values rather than closure variables. Each worklet gets its own
copy of a captured `let`, so a write in `onStart` would never be seen by
`onChange`.

## Haptics

The package imports nothing from a haptics library. `onDetentHaptic`,
`onCloseHaptic` and `onOverDragHaptic` are worklets the consumer passes —
`Presets.System.selection` from pulsar is one already — and they run inside the
gesture handler, in the frame the crossing happened.

## Why one shared gesture object per pan

A gesture builder mutates in place. `Handle` and `Content` each take their pan
from context and hand it to a `GestureDetector` untouched; a per-part opt-out
leaves the detector out rather than calling `.enabled(false)` on the shared
object, which would switch it off for every other part too.
