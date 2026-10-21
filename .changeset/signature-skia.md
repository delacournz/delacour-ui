---
"@delacour/react-native-ui": patch
---

Signature: the pad draws its strokes with Skia instead of `react-native-svg` — the finished strokes as one recorded picture and the stroke under the finger as a path traced on the UI thread, with no path string built and parsed per frame. `traceStroke` is exported for drawing a stroke into a Skia path builder; `smoothStroke`, `toSVG()` and `toPaths()` are unchanged. `react-native-skia` is now needed by `Signature`.
