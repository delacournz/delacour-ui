---
"@delacour/react-native-ui": minor
---

Add `onConfirm` to `DatePicker` and `Select` in single mode. It fires on every pick, after `onValueChange` — including a re-tap of the shown day or a press on the chosen row, which closes the sheet without `onValueChange` — and never on Clear or a dismiss, so a form can tell a confirmed value from a dismissed sheet.
