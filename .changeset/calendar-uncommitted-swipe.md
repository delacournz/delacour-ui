---
"@delacour/react-native-ui": patch
---

`Calendar.Grid` slides the current month back into view when a swipe's month change is not committed. This happens when a parent holds the controlled `month` still or passes no `onMonthChange`. Before this fix, the grid stayed off-screen and the calendar looked empty.
