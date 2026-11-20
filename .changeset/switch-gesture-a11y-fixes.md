---
"@delacour/react-native-ui": patch
---

`Switch` fixes. `Switch.Thumb` runs a caller's `onLayout` as well as measuring itself, so passing one no longer pushes an on-state thumb out past the track. A caller's `accessibilityState` is merged with `checked` and `disabled` instead of replacing them. Inside a `Field`, the switch takes the `Field.Label` text as its accessible name unless an `accessibilityLabel` is passed. A drag out and back to near its start settles by position instead of toggling, on either axis. A cancelled pan, or one that ends after the switch was disabled, commits nothing and plays no haptic.
