---
"@delacour/react-native-ui": patch
---

The screen-reader increment and decrement actions on `Calendar.Caption` no longer page a disabled calendar or the years view, and no longer fire `onMonthChange` there. They now have the same limits as the arrows.
