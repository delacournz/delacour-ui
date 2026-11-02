---
"@delacour/react-native-ui": patch
---

`DatePicker` drops a half-picked range and cancels any pending auto-close when a controlled caller closes the sheet with `isOpen={false}`. The trigger no longer shows the half range after the sheet closes, and the range does not resume when the sheet opens again. Inline pickers are unaffected.
