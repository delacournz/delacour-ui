---
"@delacour/react-native-ui": patch
---

Overlays no longer get stuck when `isOpen` flips while an enter or exit animation's finish is still queued: a stale finish is dropped before it moves the phase or calls `onEntered`/`onExited`. Under reduce motion the scrim and content now fade instead of snapping.
