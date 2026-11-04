---
"@delacour/react-native-ui": patch
---

`BottomSheet.Container` finds a `Handle` or `Background` written inside a fragment. `<>{showHandle && <BottomSheet.Handle />}</>` no longer gets a second handle and background added, which gave screen readers two adjustable elements.
