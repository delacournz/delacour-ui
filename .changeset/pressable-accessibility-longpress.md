---
"@delacour/react-native-ui": patch
---

Pressable: TalkBack's double-tap-and-hold now reaches `onLongPress` through a `longpress` accessibility action on Android, behind the same `disabled` / `busy` guard as the press. Screen-reader activation and long press are dispatched by `dispatchPressableAccessibilityAction`, which fires each handler once and never on a gated control.
