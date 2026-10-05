---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Tooltip` — a short label anchored to its control that opens on a long press (or a press, with `openOn="press"`), hides itself after `duration`, and closes on any outside tap while letting that tap through to what it landed on. It flips and shifts like `Popover`, has an inverted and a surface variant, an arrow that points at the trigger, and reads its `label` to a screen reader on the trigger without opening. `OverlayProvider` now hears every touch that starts beneath it, through `subscribeTouchStart`, without claiming any. `delacour add tooltip` copies it.
