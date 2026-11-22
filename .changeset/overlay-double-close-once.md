---
"@delacour/react-native-ui": patch
---

`Drawer` and `Dialog` report `onOpenChange(false)` once when two closes land in the same tick (a Close press and a scrim tap, a double tap) on an uncontrolled root. Both closes compared against the same render's open value and each reported; the root now compares against the value it last accepted.
