---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ColorPicker` — pick a colour by dragging, typing or tapping a preset.

- Compound anatomy: `ColorPicker.Area` (saturation and brightness), `.Hue`, `.Alpha`, `.Preview`, `.Input` (a hex field), `.Swatches` / `.Swatch`, `.Content` and `.Trigger`. A bare `<ColorPicker />` draws the area, the hue track and the field.
- Every drag runs on the UI thread through one shared value, so nothing re-renders while a finger moves. `onValueChange` fires per frame, `onValueCommit` once a change settles.
- Accepts hex (3, 4, 6, 8 digits), `rgb()`, `rgba()`, `hsl()` and `hsla()`; reports in `format` — `hex`, `rgb` or `hsl`. Greys and black keep their hue, and a controlled echo never drifts it.
- `hasAlpha` adds an opacity track whose fade keeps the same RGB end to end. `presentation="sheet"` puts the surface in a `BottomSheet` behind a trigger row drawn on `Input`'s box.
- Joins `Field`, takes `Input`'s sizes and variants, and is adjustable for screen readers in every axis, announcing on commit.
- The `color-picker` subpath imports `BottomSheet`, so it needs `@delacour/react-native-bottom-sheet` installed even inline.
- `delacour add color-picker` copies it into a project.
