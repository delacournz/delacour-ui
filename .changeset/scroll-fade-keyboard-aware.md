---
"@delacour/react-native-ui": minor
---

`ScrollFade` takes `keyboardAware`, which lifts the end fade above an open keyboard and keeps it there while the content scrolls. Without it the end fade sat under the keyboard, and over a `KeyboardAwareScrollView` it cleared for good after the first scroll. `scrollEdgeOpacity` takes an optional `coveredEnd`, and `resolveKeyboardLift` is the new pure resolver behind the lift.
