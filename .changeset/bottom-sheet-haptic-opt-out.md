---
"@delacour/react-native-ui": patch
---

`BottomSheet` honours `onSnapPointHaptic={undefined}` and `onCloseHaptic={undefined}` as the documented way to turn a haptic off. A destructuring default had put the Pulsar preset back in place of the explicit `undefined`.
