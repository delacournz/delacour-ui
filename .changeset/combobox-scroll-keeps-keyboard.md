---
"@delacour/react-native-ui": patch
"@delacour/react-native-bottom-sheet": patch
---

`Combobox` keeps its keyboard up while the results scroll; only a drag that carries the sheet down, or a close, puts it away. The sheet's scrollables now take a caller's `keyboardDismissMode` instead of always using `interactive`.
