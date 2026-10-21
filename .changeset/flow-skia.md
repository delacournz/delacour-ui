---
"@delacour/react-native-ui": minor
---

`Flow` draws its edges, background, connection preview and minimap with Skia instead of `react-native-svg`, so `react-native-skia` is now an optional peer it needs, as `Chart` and `Sketch` do. The background is a runtime shader that stays sharp at any zoom. `useThemeColors` resolves several theme colours in one lookup.
