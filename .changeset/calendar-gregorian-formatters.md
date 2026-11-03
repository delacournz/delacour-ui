---
"@delacour/react-native-ui": patch
---

`Calendar` and its date helpers always format in the Gregorian calendar that the grid uses. A locale such as `fa-IR` changes the language and digits, not the calendar. Before this fix, 5 October 2026 was labelled 13 Mehr 1405, and the month picker's names did not match the months they selected.
