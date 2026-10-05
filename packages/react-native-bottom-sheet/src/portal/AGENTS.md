# portal

Where a sheet draws, and who is on top: the provider, the host, the nearest-host
context and the registry that `Portal` reads.

## Files

| Path | What |
| --- | --- |
| `bottom-sheet-provider.tsx` | `BottomSheetProvider` — teleport's `PortalProvider`, the registry provider and the host-name context set to `"root"`. The app mounts it once. `hasPortalProvider` skips the teleport provider when one is already above |
| `bottom-sheet-host.tsx` | `BottomSheet.Host` — a teleport `PortalHost` (absolute fill, `box-none`) that provides its own name as the nearest one. The recipe for a native modal |
| `host.context.tsx` | `BottomSheetHostNameContext` — the nearest host's name, `null` with no provider; `useBottomSheetHostName` / `useOptionalBottomSheetHostName` |
| `sheet-registry.ts` | The pure reducer: `reduceRegistry`, `topOf`, `zIndexOf`, `isTop`, `INITIAL_REGISTRY`. Tested without a renderer |
| `sheet-registry.test.ts` | Increasing z, re-open brings forward, `replace` closes the same host only, unknown close is the same state, top per host |
| `sheet-registry.context.tsx` | `SheetRegistryProvider` (reducer state in React, the id → methods map) and `useBottomSheetRegistry() → { dismissAll, dismiss }` |

`sheet-registry.ts` and `sheet-registry.context.tsx` are two files on purpose:
`./sheet-registry` must resolve to the maths, and a `.ts` and a `.tsx` of one
name would leave that to the bundler.

## One implementation

`BottomSheet.Portal` is one component with two destinations. With a
`BottomSheetProvider` above it and no `inline`, the frame is written inside a
teleport `Portal` bound to the nearest host — `"root"` under a bare provider,
or the host a native modal screen wrote last, or the `hostName` prop. Teleport
moves the **native** view and leaves the React tree where it was, so every
context provided around the trigger — a theme, a form, a query client — still
reaches the sheet's parts with nothing re-provided. Without a provider, or
with `inline`, the frame renders where it is written.

There is no `BottomSheetModal`, and no minimise/restore stack. A modal sheet is
a sheet whose portal teleports, and that is the default.

The teleport `Portal` wrapper is an absolute fill of the host with the
registry's `zIndex`; the frame inside it is the same absolute fill, `box-none`,
so a closed sheet takes no touch and the app under it stays interactive.
Teleport's native `PortalView` hit-tests only its subviews, so the wrapper is
transparent to touches too.

## The registry

A sheet is in the registry while it is **presented** — from the open that
mounted its children to the settle at `-1` that unmounts them — under the host
its portal chose. An inline sheet registers under a host of its own
(`inline:<id>`), so nothing replaces it and it is always its own top.

`reduceRegistry` stamps each open with the next `z`; the frame and the panel
carry it as `zIndex`, and sheets in one host are siblings, so the later open
draws on top. Opening a sheet already open re-stamps it, which brings it
forward. `stackBehavior: "replace"` drops every other sheet in the same host
and reports them; the provider calls each one's `close()`, they animate out,
and their own settle finds nothing to remove.

`useBottomSheetRegistry()` returns `dismissAll` and `dismiss(id)`; the root
registers `{ close, forceClose }` under its `useId` on mount. Both throw
outside the provider — there is nothing to ask without one — and the
`useOptional` form returns `null`.

`closeOnBack` subscribes to `BackHandler` only while the sheet is presented
**and** `isTop` in its host, so a back press closes the top sheet and the one
under it survives. Without a registry every sheet is its own top. iOS has no
back button; the unit test on `isTop` is what stands in for the device check.

## Hosts

`BottomSheet.Host` is for the one place the root host cannot reach: a native
modal. A `Modal`, or a screen a navigator presents as one, is its own window,
and a sheet teleported to the root draws behind it. The host is written
**last** in that screen so it is the topmost sibling, and it provides its own
name as the nearest one, so every sheet written in the screen lands there
without a `hostName`.

A host needs the provider above it — teleport's `PortalHost` reads the
provider's manager — and it must not be written inside a sheet: a sheet
teleported into another sheet's panel is clipped by it and moves with it. Both
warn in development.

## Detached

`detached` is resolved once by the root (`resolveDetached`) and handed to the
parts through the internal context, next to the shared-value copy the geometry
reads. `Container` derives `left` and `width` from `detachedFrame` on the UI
thread, turns `overflow` visible so a card's shadow is not clipped, and is
`box-none`, so a touch in the gap under the card falls through to the
overlay. The frame is `overflow: visible` too. The overlay is unchanged — it
fills the frame, margins and gap included, so a tap there closes. The rest is
`core/`: `closedHeight` is `−restingBottom`, so closed is `translateY =
containerHeight` and the card is fully off-screen; `%` snap points resolve against
the height above the resting line; `keyboardLift` subtracts the gap. The
corners are the consumer's `Background` style.

**The card moves as one rigid body.** The panel is as tall as the frame, so a
detached `Background` is sized by the geometry's `surfaceHeight`
(`core/geometry/surface-height.ts`): the sheet's `height` between its snap points,
the first snap point's height below them and the last's above. A drag down to
close, the close animation, a rubber-band under the lowest snap point and an
over-drag past the highest therefore leave the surface, the body and the
footer exactly as they were and let `translateY` alone move the card, bottom
corners included, through the gap and off the screen. `Content` clamps its
body to `surfaceHeight − handleHeight` for the same reason.

## Sharing teleport's provider

There must be one teleport `PortalProvider` per app: teleport registers hosts natively by name,
and two providers would mean two hosts called `"root"`. `hasPortalProvider` lets an app that
already mounts one — `@delacour/react-native-ui`'s `OverlayProvider` is the case it was added for
— mount the sheet registry and host name alone. Sheets then teleport into the outer provider's
`"root"`, and their registry `z` (from 1) still orders them among themselves; the skin's overlays
draw in bands above 1000. The skin's `BottomSheetProvider` passes the flag for you.
