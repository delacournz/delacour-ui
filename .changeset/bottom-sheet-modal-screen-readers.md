---
"@delacour/react-native-ui": patch
---

A `BottomSheet` with an `Overlay` hides the app behind it from VoiceOver and TalkBack while it is presented in the root host. `BottomSheetProvider` hides its children, as `OverlayProvider` does for a dialog. Inline sheets, sheets in another `BottomSheet.Host` and `enableTouchThrough` leave the app reachable.
