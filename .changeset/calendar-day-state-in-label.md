---
"@delacour/react-native-ui": patch
---

`Calendar.Day` now puts "Today", "Range start" and "Range end" in its accessibility label ("Monday 5 October 2026, Today, Range start") instead of the hint, so they are read with VoiceOver hints off. `resolveDayAccessibilityLabel` is exported from the variants.
