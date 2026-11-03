---
"@delacour/react-native-ui": patch
---

Overlay presence timing no longer restarts when the owner re-renders with new inline `onEntered`/`onExited` callbacks: they are read through refs, so only `isOpen` drives the enter and exit animations.
