---
"@delacour/react-native-ui": minor
"@delacour/react-native-bottom-sheet": patch
"delacour": patch
---

Add `OverlayProvider`, the layer every overlay is drawn on

`@delacour/react-native-ui/overlay` mounts the one teleport host that overlays and bottom sheets
share, and a registry that orders them in bands — every overlay above every sheet, an anchored
panel above the dialog that opened it, a toast above both — and gives Android's back button to the
topmost overlay only. `Overlay.Portal`, `Overlay.Scrim`, `useOverlayPresence` (keeps an overlay
mounted through its exit animation) and `useOverlayBackHandler` are exported for building more.
`BottomSheetProvider` now detects an `OverlayProvider` above or below it and mounts teleport's
provider only once; the engine's provider takes `hasPortalProvider` to make that possible.
`bunx delacour add overlay` copies it into a project.
