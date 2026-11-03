---
"@delacour/react-native-ui": patch
---

`resolveWeekStart` reads the device locale on engines without `Intl.Locale`, such as some Hermes builds. Before this fix, a `Calendar` with no `locale` on such an engine started the week on Monday, even on an en-US or ja-JP phone.
