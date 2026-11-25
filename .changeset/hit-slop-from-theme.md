---
"@delacour/react-native-ui": patch
---

Minimum hit targets follow the resolved theme instead of the default tokens. A new `useThemeLength` hook (in `hooks/use-minimum-hit-target`) reads a length variable live through Uniwind, so `hitSlop` follows `updateCSSVariables` and a denser style. Button, Pagination, Calendar's arrows, the Combobox trigger, Chip's and Badge's close glyphs, and the Dialog and BottomSheet ✕ now size their slop from `--spacing-button-*`, `--spacing-input-*` and `--spacing-icon-*`. Under a style with `button-sm` 32 and `md` 36, those targets now reach 44 where neighbours allow. No pixel moves, and the exported default-theme constants are unchanged.

Badge's dismiss control is named "Remove {label}" (the new `labels.badge.removeNamed`) when the badge has text, so a row of dismissible badges no longer reads as identical "Remove" stops. An app that localises `badge.remove` should also set `badge.removeNamed`. A Combobox trigger showing a single selection now carries it in its name ("Country, Fiji") rather than as its accessibility value.
