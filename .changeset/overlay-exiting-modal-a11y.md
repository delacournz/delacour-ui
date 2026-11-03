---
"@delacour/react-native-ui": patch
---

A modal overlay that is animating closed no longer hides the app content from screen readers, so a Dialog or Drawer that moves focus back to its trigger in `onExited` lands on it. `Overlay.Portal` takes `isExiting`; pass `useOverlayPresence().phase === "exiting"`.
