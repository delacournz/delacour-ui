---
"@delacour/react-native-ui": patch
---

Selecting an outside day with `selectOutsideDays` no longer pages `Calendar` past `startMonth`/`endMonth` (or `minDate`/`maxDate`). The day is still selected, but the grid stays inside the bounds that the arrows and the swipe keep.
