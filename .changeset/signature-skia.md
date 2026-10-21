---
"@delacour/react-native-ui": minor
---

Signature: the pad draws its strokes with Skia instead of `react-native-svg` — the finished strokes as one recorded picture and the stroke under the finger as a path traced on the UI thread, with no path string built and parsed per frame. `traceStroke` is exported for drawing a stroke into a Skia path builder; `smoothStroke`, `toSVG()` and `toPaths()` are unchanged. `react-native-skia` is now needed by `Signature`.

Signature: the ref gains `toPNG()`, the signature as a base64 PNG framed and coloured exactly as `toSVG()` with the same options, at `scale` pixels per point. `resolveSignatureExport` and `signaturePngSize` are exported.
