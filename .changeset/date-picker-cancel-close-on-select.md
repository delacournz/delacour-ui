---
"@delacour/react-native-ui": patch
---

`DatePicker` cancels the pending auto-close on every selection. Starting a new range, or deselecting the day, within 120 ms of a finished selection no longer closes the sheet on an unfinished or empty selection.
