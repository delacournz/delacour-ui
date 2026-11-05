---
"@delacour/react-native-ui": patch
---

`Slot` now throws for a fragment child. A fragment passes `isValidElement` but drops the props it is given, so an `asChild` trigger around a fragment did nothing.
