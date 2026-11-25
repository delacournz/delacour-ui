---
"@delacour/react-native-ui": patch
---

Minimum hit targets follow the resolved theme instead of the default tokens. A new `useThemeLength` hook (in `hooks/use-minimum-hit-target`) reads a length variable live through Uniwind, so `hitSlop` follows `updateCSSVariables` and a denser style. Button, Pagination, Calendar's arrows, the Combobox trigger, Chip's and Badge's close glyphs, and the Dialog and BottomSheet ✕ now size their slop from `--spacing-button-*`, `--spacing-input-*` and `--spacing-icon-*`. Under a style with `button-sm` 32 and `md` 36, those targets now reach 44 where neighbours allow. No pixel moves, and the exported default-theme constants are unchanged. Calendar's arrows no longer let their slop reach the caption beside them, so under the default style an arrow is 42 wide rather than 44.

Badge's dismiss control is named after its badge, "Remove Beta", when the badge has text, so a row of dismissible badges no longer reads as identical "Remove" stops. The name is `labels.badge.remove` followed by the text, so an existing localisation keeps its verb; the new optional `labels.badge.removeNamed` sets a different word order.
