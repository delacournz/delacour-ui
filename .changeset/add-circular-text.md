---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `CircularText` — text set around a circle, optionally turning

The text sits on a `react-native-svg` `TextPath`, laid out once by the platform's shaper and closed
exactly with `textLength`. `span` is a full ring, an arc or natural spacing; `side` stands the glyphs
outside or inside the circle; `repeat="fill"` repeats a phrase until the ring closes. `spin` is a
steady `loop` in degrees per second, driven by a frame-callback integrator so a `pause` (by press or
by state) eases to a halt and resumes without a snap, or a `controlled` angle from a shared value.
`centerContent` stays upright and independently accessible, the ring reads once with separators
stripped, and a `loop` holds still under reduce motion or `isMotionCalm`.
