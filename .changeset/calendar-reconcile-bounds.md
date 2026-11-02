---
"@delacour/react-native-ui": patch
---

`Calendar` moves the visible month to the nearest bound when `minDate`/`maxDate` or `startMonth`/`endMonth` change and leave it outside, and reports the move through `onMonthChange`. Before this fix, moving `minDate` past the visible month disabled both arrows and the swipe, and the calendar could not reach a day that can be picked.
