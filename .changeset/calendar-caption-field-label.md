---
"@delacour/react-native-ui": patch
---

`Calendar.Caption` now reads an enclosing `Field.Label` before the month ("Date of birth, October 2026"). The label used to sit only on the grid, which is not `accessible` and gets no iOS trait from `role="grid"`, so VoiceOver never read it. `resolveCaptionLabel` is exported from the variants.
