---
"@delacour/react-native-ui": patch
---

`Avatar` remounts its image when the source changes, so a late error from an expired URL no longer marks the refreshed one as failed.
