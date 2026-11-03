---
"@delacour/react-native-ui": patch
---

`Calendar`'s years view scrolls to the visible year each time it opens. Before this fix, if you picked a year and then reopened the years view from the months view, the list started at the earliest year.
