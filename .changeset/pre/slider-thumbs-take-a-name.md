---
"@delacour/react-native-ui": patch
---

`Slider.Thumb` now has an accessible name. It defaults to the enclosing `Field.Label`'s text — the label alone for one thumb, "…, minimum" and "…, maximum" for a range's two — and an `accessibilityLabel` on the thumb wins outright. A range with no label still reads "Minimum" and "Maximum". `Field.Label` registers its text with the field's context (`label` / `registerLabel`), so any control can read it; `resolveFieldLabelText` and `resolveThumbAccessibilityLabel` are exported.
