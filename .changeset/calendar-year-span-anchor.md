---
"@delacour/react-native-ui": patch
---

`Calendar`'s years view lists the year the calendar shows. The open side of the year span now reaches from the visible month, not from today, and never past the opposite bound. A calendar with only `maxDate` in 1900 lists 1800–1900, where the list was empty before.
