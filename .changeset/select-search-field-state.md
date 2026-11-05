---
"@delacour/react-native-ui": patch
---

The `Select` search field no longer takes `isDisabled` or `isInvalid` from an enclosing `Field`. An enabled select inside a disabled field can now be searched, and an invalid value no longer marks the query invalid.
