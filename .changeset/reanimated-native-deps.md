---
"@delacour/react-native-ui": patch
"@delacour/react-native-bottom-sheet": patch
---

Components no longer pass dependency arrays to Reanimated's `useAnimatedStyle`, `useDerivedValue`, `useAnimatedReaction` and `useAnimatedScrollHandler`. Reanimated ignores them on native and warned once per app in development: "Dependencies should only be used on the web and are always ignored on native". Nothing changes at runtime; the worklets still rebuild from their closures.
