# layout

How the sheet learns the sizes the geometry needs.

## Files

| Path | What |
| --- | --- |
| `use-measure-height.ts` | An `onLayout` that writes a view's height into a shared value, and resets it to `UNMEASURED` on unmount |
| `use-container-layout.ts` | The frame's `onLayout` and ref: height and width, plus `measureInWindow` for the offset between the frame's bottom and the window's |

## What is measured

| Value | By | Read for |
| --- | --- | --- |
| `containerHeight`, `containerWidth` | the frame `Portal` renders | every snap point, `position`, the detached frame |
| `containerBottomOffset` | the same frame, via `measureInWindow` | how much of a keyboard overlaps the sheet at all (BSHEET-3) |
| `handleHeight` | `Handle` | the dynamic snap point, `contentArea` |
| `contentHeight` | `Content`'s inner box | the dynamic snap point |
| `footerContentHeight` | `Footer`'s inner box (BSHEET-3) | the dynamic snap point, `footerTop` |

Scrollables (BSHEET-4) feed `contentHeight` from `onContentSizeChange`
instead of a layout.

## The reset is the point

A portal that unmounts its children on close takes the handle and the content
with it. If their heights stayed, `layoutReady` would be true for a sheet with
nothing in it and the next open would animate before the new content had
measured. Every measuring hook resets its value to `UNMEASURED` on unmount, so
the open goes back on the intent queue until the measurement lands again.

A handle that is never written is a handle of height zero: `Container` reports
that on mount when no `Handle` registered, so a handle-less sheet is not a
sheet that never becomes ready.

## Container resize

The frame's height goes through `acceptContainerLayout`, which refuses
Android's adjustResize double-count while a keyboard is up. Inert until
BSHEET-3 writes `keyboardHeight`, and correct once it does. A height that is
accepted while the sheet is open makes the intent reaction jump the sheet to
the same index in the re-derived snap points (`state/`).

## No synchronous first read

The plan mentioned a Fabric `getBoundingClientRect` in a layout effect for a
synchronous first measurement. It is not here: the open intent waits on
`layoutReady` anyway, so the only thing a synchronous read would buy is one
frame off the first open, and it would buy it with a host-instance method the
type definitions do not yet name. Add it here, in these two hooks, if that
frame ever shows.
