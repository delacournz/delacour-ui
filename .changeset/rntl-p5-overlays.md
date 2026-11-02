---
"@delacour/react-native-ui": patch
---

Fix screen-reader gaps found by the overlay render tests:

- `Menu` and `ContextMenu` rows can be chosen with VoiceOver and TalkBack. A row now answers `onAccessibilityTap` on iOS and the `activate` action on Android, and a disabled row still ignores both.
- `Screen`'s navbar title and `Screen.Error`'s title are announced as headings.
- The render-test setup marks `AppState` as active. React Native's Jest mock otherwise reads as backgrounded, which kept a toast from ever dismissing itself.
- A composed `ImageViewer` (Triggers as children, no `images`) opened with `defaultOpen` or a controlled `open` no longer shuts itself on mount before its Triggers register.
