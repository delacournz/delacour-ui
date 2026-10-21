---
"@delacour/react-native-ui": patch
---

`Tour` draws its dimmed mask with Skia instead of react-native-svg: a window-sized rect with the spotlight clipped out, its rounded-rectangle hole derived on the UI thread from the existing shared values rather than rebuilt as a path string every frame. `@shopify/react-native-skia` is now a peer of `Tour`. `resolveMaskHole` is exported; `buildMaskPath` is deprecated and no longer used by the tour.
