---
"@delacour/react-native-ui": minor
---

Add `initialView` to `Calendar` and `DatePicker`, so a date of birth can open on the year list and be picked as a year, a month and a day. `Calendar` reads it on mount and ignores it under a `label` caption. `DatePicker` applies it only while empty; with a value it opens on that value's month. `DatePicker`'s `defaultMonth` now also applies only while empty, so reopening a picked date shows its month rather than `defaultMonth`. Each opening of the sheet now remounts the calendar, so it never resumes from where the last opening was paged to.
