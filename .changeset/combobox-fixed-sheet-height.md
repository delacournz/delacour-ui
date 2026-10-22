---
"@delacour/react-native-ui": patch
---

`Combobox` opens its sheet at its cap and holds that height while it is open, instead of sizing it to the filtered rows — typing no longer resizes the sheet, and the keyboard arriving no longer moves it. `resolveComboboxSheetHeight` is the new pure resolver behind it.
