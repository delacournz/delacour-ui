---
"@delacour/react-native-ui": patch
---

`Separator` can no longer be unhidden from assistive technology:

- `SeparatorProps` omits `accessible`, `accessibilityElementsHidden` and `importantForAccessibility`.
- Caller props are spread before the hidden props, so a cast cannot override them.
