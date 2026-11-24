---
"@delacour/react-native-ui": patch
---

Make a slow drag on `DatePicker`'s year list actually scroll it. The list's native scroll is now declared simultaneous with the sheet's content pan as well as blocking it; with the block alone, the scroll view waited on the blocked pan and neither the list nor the sheet moved.
