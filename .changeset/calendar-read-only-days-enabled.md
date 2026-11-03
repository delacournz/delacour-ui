---
"@delacour/react-native-ui": patch
---

A read-only `Calendar` no longer announces every day as disabled ("dimmed"). A read-only day keeps an enabled accessibility state, its tap is still ignored, and it skips the press fade and haptic. `CalendarDayState` gains `isUnavailable` for the days that are announced disabled.
