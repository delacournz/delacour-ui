---
"@delacour/react-native-ui": patch
---

Screen scrollables compose a caller's `onScroll` with their own scroll tracking. `Screen.FlatList`, `SectionList` and `LegendList` used to drop it; `Screen.ScrollArea` let it replace the tracking, freezing `ScrollShadow` and the navbar border. A plain callback and a `useAnimatedScrollHandler` result are both accepted.
