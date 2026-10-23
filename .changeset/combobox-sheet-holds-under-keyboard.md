---
"@delacour/react-native-bottom-sheet": minor
"@delacour/react-native-ui": patch
---

`BottomSheet` takes `keyboardLiftLimit="highestSnapPoint"`: the keyboard lifts the sheet no higher than its highest snap point, so a sheet resting there holds still and its body shrinks by the keyboard instead. `Combobox` opens at its full height with it, so its sheet no longer opens half-height, jumps up when the search field's keyboard rises, and drops back as the keyboard leaves on close. `resolveComboboxSheetHeight` takes only `topInset` and `windowHeight` now.
