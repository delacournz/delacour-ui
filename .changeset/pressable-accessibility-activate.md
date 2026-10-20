---
"@delacour/react-native-ui": patch
---

`Pressable` wires screen-reader activation to `onPress` behind the same `disabled` / `busy` guard as the tap: `onAccessibilityTap` on iOS, so a VoiceOver double-tap no longer relies on UIKit synthesising a touch, and an `activate` action on Android, where a TalkBack double-tap previously fell through to a click with no listener. A caller that lists `activate` itself still owns it, and a caller's other actions are merged in. Every control built on `Pressable` — `Button`, `ListGroup.Item`, back and close buttons — inherits it.
