---
"@delacour/react-native-ui": patch
---

A re-tap on a single `DatePicker`'s shown day now confirms it and closes the sheet instead of clearing it. A user who opens a date of birth to check it no longer empties it by tapping it. `DatePicker.Clear` (`isClearable`) stays the way to empty a single day.
