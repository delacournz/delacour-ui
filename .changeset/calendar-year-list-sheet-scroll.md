---
"@delacour/react-native-ui": patch
---

Scroll `DatePicker`'s year list on a slow drag instead of moving the sheet. `Calendar` takes `yearListBlocksGesture`, a gesture its year list blocks while it scrolls, and `DatePicker.Calendar` passes its sheet's content pan. The year list also gets a part `testID`, `<testID>-years`.
