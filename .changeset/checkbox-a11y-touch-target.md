---
"@delacour/react-native-ui": patch
---

Checkbox: a caller's `accessibilityState` no longer drops the checked or mixed state, a bare box inside a `Field` takes the field's label as its accessible name, and a labelled row is padded to the 44pt touch minimum (`Checkbox.Group` drops its gap so rows do not overlap).

Checkbox.Group: two toggles before a render keep both values, and a grouped checkbox now calls its own `onCheckedChange`.
