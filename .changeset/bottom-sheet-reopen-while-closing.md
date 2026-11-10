---
"@delacour/react-native-bottom-sheet": patch
---

BottomSheet: a `Trigger` (or `ref.open()`) pressed while the sheet animates closed is no longer dropped. The sheet turns round and animates back open at once, instead of waiting for the close to settle. A swipe, an overlay press or `Close` left `isOpen` true until the settle, so the open was read as a no-op.
