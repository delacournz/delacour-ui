# Overlay

The layer under every overlay in this library — Dialog, Drawer, Popover, Tooltip, Toast,
Feedback. Not a component anyone renders on its own: the provider an app mounts once, and the
parts and hooks an overlay is drawn with.

`import { Overlay, OverlayProvider, useModalAccessibility, useOverlayBackHandler, useOverlayPresence } from "@delacour/react-native-ui/overlay";`

`react-native-teleport` is an **optional peer**, as it is for `BottomSheet`: an app that never
imports an overlay never resolves it. The consequence is the same one thing to do — **mount
`OverlayProvider` once**, inside `DelacourProvider`, around `BottomSheetProvider` and the navigator.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/overlay` |
| `overlay.tsx` | `Overlay` — the root is the provider: teleport's `PortalProvider` (skipped when one is already above), the registry and the touch-start fan-out; the `Object.assign` names `Portal` and `Scrim`. `OverlayProvider` is the same component, under the name a root layout reads best with |
| `overlay-portal.tsx` | `Overlay.Portal` — registers while mounted, reports `isExiting`, teleports to `"root"` in a `box-none` absolute fill carrying the registry's `zIndex`; inline without a provider |
| `overlay-scrim.tsx` | `Overlay.Scrim` — `bg-overlay`, opacity follows presence, hidden from assistive technology |
| `overlay.context.tsx` | **Leaf.** `OverlayContext`, `TeleportProvidedContext` and their hooks. `bottom-sheet/` imports it |
| `overlay-registry.ts` | **Pure.** The z-order reducer, `zIndexOfOverlay`, `topOverlay`, `isTopOverlay`, `hasModalOverlay`, `hidesAppContent`, `topModalOverlay`, `isBelowTopModal`, `OVERLAY_LAYER_BASE` |
| `overlay-presence.ts` | **Pure.** `reducePresence` — `closed → entering → open → exiting → closed`; `isCurrentFinish` |
| `overlay-teleport.ts` | **Pure.** `TELEPORT_INLINE`, `isTeleportInline` — whether teleport draws an overlay in place, as its Jest mock does |
| `overlay.variants.ts` | `overlayVariants` (`scrim`), `OVERLAY_MOTION`, `OVERLAY_SCRIM_TOKEN` |
| `use-overlay-presence.ts` | `useOverlayPresence` — keeps an overlay mounted through its exit, drives `progress` 0 → 1 |
| `modal-accessibility.ts` | **Pure.** `firstFocusTarget`, `isModalOnTop`, `resolveModalContainerAccessibility` — which container holds a screen reader, and where focus lands |
| `use-modal-accessibility.ts` | `useModalAccessibility` — a modal container's `accessibilityViewIsModal` and escape, focus to its title on enter and back to its trigger on exit; `focusAccessibilityTarget` |
| `use-overlay-back-handler.ts` | `useOverlayBackHandler` — Android back, only while the overlay is the top |
| `overlay.render.test.tsx` | Mounted under Jest — provider and portal mounting, registry entry and z-order while mounted, scrim semantics and dismiss, app content hidden behind a modal only when teleport moves it out and reachable again while it exits, a dialog under another dialog hidden, presence unmount after exit and one timing per transition under owner re-renders, back handler (top-only, toast excluded), touch fan-out |
| `*.test.ts` | The registry, the presence machine, the modal-accessibility resolvers, the scrim token and the motion constants |

## Design

- **There is exactly one teleport `PortalProvider` in an app, and this is why the folder
  exists.** Teleport registers its hosts natively by name, and the bottom-sheet engine's
  provider already mounts one with a `"root"` host. Six overlays each mounting their own would
  mean seven hosts called `"root"`. So `OverlayProvider` and this library's `BottomSheetProvider`
  each mount teleport's provider only when `TeleportProvidedContext` says none is above, and set
  it when they do — either mount order works, and the engine's provider learned
  `hasPortalProvider` to make the skip possible. Everything draws into one `"root"` host.
- **One host means one z-order, so the layers are bands.** Sheets are stamped from 1 by the
  engine's registry; overlays take `modal` 1000+, `anchored` 2000+, `toast` 3000+. Every overlay
  draws over every sheet, a popover over the dialog that opened it, a toast over both. Within a
  band the later open is on top, and a re-open brings an overlay forward. The number is base plus
  **rank** in the band, never the raw open counter, so a long session cannot walk a dialog into
  the popover band — a test opens five thousand to prove it. The cost: a sheet opened *from* a
  dialog draws under it. Do not open a sheet from a dialog.
- **The registry entry lives exactly as long as `Overlay.Portal` is mounted.** Mount the portal
  only while `useOverlayPresence().isPresent`, and the registry, the z-order and the back button
  all follow presence with nothing else to keep in sync.
- **Back closes only the top overlay.** `useOverlayBackHandler` takes the portal's `id` and
  subscribes only while that id is `topOverlay` among `modal` and `anchored` — a toast never takes
  the back button. React Native calls the most recent listener first, and an overlay over a sheet
  subscribed after it, so the overlay answers first and returns `true`.
- **Presence is a reducer so an interrupted animation is boring.** A re-open mid-exit goes back
  to `entering` from wherever `progress` is; a close mid-entrance goes to `exiting`. The finish
  callback reaches React only when the timing ran to the end, and a stale finish (`entered` while
  `exiting`) is a no-op in the reducer. A finish can also be queued for React just as the owner
  flips `isOpen`, before the new phase renders, so each timing carries its transition generation
  and `isCurrentFinish` checks it and the requested state before the hook sends the finish or calls
  `onEntered`/`onExited`.
- **Overlay motion is behaviour, not decoration.** `isMotionCalm` does not still it — an overlay
  that did not appear would change what the screen says — but every animation is finite, so an E2E
  runner's settle wait ends anyway. Under reduce motion the fade still runs (opacity is not
  motion): both timings set `ReduceMotion.Never`, or Reanimated's default `System` policy would
  snap the scrim, and `isReduced` tells the component to drop its transforms. Exit (160 ms) is quicker
  than entrance (220 ms): a dismissed overlay should get out of the way.
- **The scrim is `bg-overlay` at opacity 1**, the token carrying its own alpha, for
  `BottomSheet.Overlay`'s reason. It is React Native's `Pressable`, not this library's: it wants
  no feedback or haptic, and a Gesture Handler tap there would race a drawer's pan for the touch.
  It always takes the touch, even with no `onDismiss`, because the app under a non-dismissible
  dialog must not be pressable. It is hidden from assistive technology; a screen reader user
  dismisses through the panel's `onAccessibilityEscape` or the back button.
- **A modal overlay hides the app from screen readers.** Teleport's `"root"` host is a sibling of
  the provider's content `View`, so a panel's `accessibilityViewIsModal` hides only its siblings in
  the host, and VoiceOver or TalkBack could still reach the app behind a dialog. While
  `hidesAppContent` is true the provider sets `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` on that `View`. Overlays and sheets draw in the
  host, outside it, and stay reachable. **An exiting modal does not count.** Pass
  `isExiting={phase === "exiting"}` to `Overlay.Portal`, as Dialog and Drawer do: the registry keeps
  the entry, and its place in the z-order, until the portal unmounts, but the app is reachable again
  from the start of the exit, so `onExited` can move focus back to the trigger. **Not when teleport draws inline.** `react-native-teleport`'s
  Jest mock renders a portal in place, inside that `View`, so hiding it would hide the dialog too
  and every query for it would fail. The test kit sets the global `TELEPORT_INLINE` symbol to say
  so, and the provider then leaves the app visible. It is a symbol on `globalThis`, not an import, so
  the test kit installs without Overlay. **Not for a modal drawn in the app.** A portal with
  `isInline` or a `hostName` other than `"root"` may be inside that `View`, so it registers with
  `isInApp` and does not hide the app. It still stacks and takes the back button.
- **Screen readers stay inside the top modal.** Hiding the app content does not hide a dialog under
  another dialog: both draw in the `"root"` host. So each portal reads the registry: the top open modal's frame sets `accessibilityViewIsModal`, and every frame drawn
  under it sets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.
  A popover or toast above the top dialog is in a higher band and stays reachable. When the top
  dialog starts to exit, the one under it is the top again. A bottom sheet is not in this registry,
  so a sheet under a dialog is not hidden yet.
- **Every modal container goes through `useModalAccessibility`.** Dialog, Drawer, Menu,
  Popover, Fab.Group, SectionProgress, SectionRail, Tour and ImageViewer each held VoiceOver,
  wired the escape scrub and moved focus in and out by hand, and each had drifted: one used the
  deprecated `setAccessibilityFocus`, one forgot to restore focus, one had no escape. The hook
  owns the three things they share. `containerProps` sets `accessibilityViewIsModal` and
  `onAccessibilityEscape` only while the owner's `isOpen` is true **and** `isModalOnTop` says the
  container is the top `modal`/`anchored` overlay that is not exiting — a dialog under its own
  menu lets go, and two modal siblings never fight over VoiceOver. A container with no `id`, or
  one the registry has not recorded, is its own top. `focusInitial` moves focus to the first
  mounted of its `initialFocus` refs (title, then first item, then the container) — call it from
  `onEntered`, after the entrance, when the view is focusable. `restoreFocus` returns focus to
  the trigger — call it from `onExited`, which is why an exiting modal stops hiding the app.
  Both read their refs when they run and are stable, so `useOverlayPresence` never restarts a
  timing for them. Focus moves through `sendAccessibilityEvent(node, "focus")`, not the deprecated
  `setAccessibilityFocus` + `findNodeHandle`. Android containment is not the hook's job: the
  provider and portal already hide everything outside the top modal. The bottom-sheet engine
  cannot import this package, so it carries the same three rules in its own code.
- **`use-modal-accessibility.ts` and `modal-accessibility.ts` are leaves.** They import React,
  React Native, `overlay.context.tsx` and the pure registry — never `overlay.tsx`, which pulls in
  `react-native-teleport`. A component that does not draw through `Overlay.Portal` (Menu in a
  React Native `Modal`, Fab.Group and SectionProgress inline) imports the hook from
  `../overlay/use-modal-accessibility` rather than `../overlay`, so using it does not make an app
  resolve the optional teleport peer (package rule 3's leaf exception).
- **The portal's wrapper is `box-none`.** An overlay with no scrim — a toast, a tooltip — leaves
  the app under it interactive.
- **The provider hears every touch that starts beneath it, and claims none.** Its children sit in a
  `flex: 1` `View` whose `onTouchStart` fans out to `subscribeTouchStart` listeners. `onTouchStart`
  is a bubbling touch event, not a responder negotiation, so it never stops the touch reaching its
  target or a Gesture Handler gesture; and React Native bubbles it through the React tree rather
  than the native one, so a touch inside a teleported overlay arrives too. It exists for Tooltip,
  whose outside tap must close it *and* still press what it landed on — a full-screen catcher
  under the panel, Popover's way, would swallow that tap, and nothing but a common ancestor of the
  whole app can hear a touch on a view the tooltip knows nothing about.
- **No provider, no teleport.** Without `OverlayProvider` a portal renders inline, in an absolute
  fill of the nearest positioned ancestor, and warns once in development; it may be clipped. That
  is a working fallback for a `delacour add` copy in an app that has not mounted the provider yet,
  not a supported layout.
- **`DelacourProvider` cannot mount this** — the peer decision in
  [DelacourProvider](../provider/AGENTS.md): teleport is optional. `apps/playground/src/app/_layout.tsx`
  is the reference mount.

## Testing

The registry, the presence machine, the scrim token and the motion constants are pure and unit-tested.
The render tests mount the provider and portals under Jest: registry entry
and z-order, scrim, presence, back handler and touch fan-out, and what screen readers can reach while
a modal is open, exiting, or under another modal. `useOverlayPresence` is also tested with an owner
that re-renders every frame: one timing per transition and one on-time finish. The native teleport
host is not in Jest, so the provider, the portal and the hooks are also checked on a simulator through
every overlay's gallery — the foundation has no gallery of its own, the way `DelacourProvider` has none.
