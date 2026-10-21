---
"@delacour/react-native-ui": minor
"@delacour/react-native-charts": minor
---

Move to `react-native-skia` 3, the package `@shopify/react-native-skia` was renamed to. The optional `react-native-skia` peer replaces `@shopify/react-native-skia` and needs `>=3`, which needs Android `minSdkVersion` 26. `Sketch`'s `toPNG()` renders on `Skia.Surface.MakeRaster`.
