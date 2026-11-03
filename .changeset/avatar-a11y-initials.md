---
"@delacour/react-native-ui": patch
---

`Avatar` falls back to the accessible name "Avatar" when it is pressable and has no `name`, `fallback` or `accessibilityLabel`, so it is never read as only "button". Initials keep their accent when the name arrives in NFD form.
