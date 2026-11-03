---
"@delacour/react-native-ui": patch
---

`DatePicker` stays controlled whenever `value` is passed, even as `undefined`, which now reads as empty. A form field that starts `undefined` or resets to it no longer flips the picker to its own state and leaves a stale day on the trigger.
