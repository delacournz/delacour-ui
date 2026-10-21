---
"@delacour/react-native-ui": patch
---

`SectionProgress` draws its ring with Skia instead of `react-native-svg`: a track circle and a fill path trimmed to the progress shared value, with the same size, stroke, colours and twelve o'clock start. `react-native-skia` (already an optional peer) is now needed by `section-progress`. `resolveRingDashOffset` is replaced by `resolveRingTrimEnd` (the clamped 0–1 trim) and `resolveRingOval` (the stroke's centre-line box).
