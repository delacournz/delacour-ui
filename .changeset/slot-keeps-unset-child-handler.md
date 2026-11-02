---
"@delacour/react-native-ui": patch
"@delacour/react-native-bottom-sheet": patch
---

`asChild` keeps the handler it donates when the child forwards an unset one. `<BottomSheet.Trigger asChild><Button onPress={maybe} /></BottomSheet.Trigger>` with `maybe` undefined now opens the sheet; before, the child's `undefined` replaced the trigger's `onPress`.
