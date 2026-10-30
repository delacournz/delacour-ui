---
"@delacour/react-native-ui": minor
---

`DatePicker` takes `onClose`, called once its sheet has slid all the way down. `onOpenChange(false)` still fires as the close starts, so a form can move focus to the next field in `onClose` without the keyboard rising under a sheet that is still leaving.
