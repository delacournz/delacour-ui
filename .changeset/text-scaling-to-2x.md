---
"@delacour/react-native-ui": minor
---

Text scales to 2× the design size (WCAG 1.4.4), and the chrome that holds it grows instead of clipping.

- `TEXT_MAX_FONT_SIZE_MULTIPLIER` is 2 (was 1.4). Every library `Text`, Input's `TextInput` and TextAnimation default to it.
- Button (`sm|md|lg`), ProgressButton, SlideButton's rail, Input (single-line, and so Select, TimePicker and every trigger built on `inputVariants`), Calendar cells, days and picker rows, Pagination targets, Attachment chips, an extended Fab, a Toast action and MessageScroller's jump pill and unread count use `min-h-*` floors in place of fixed `h-*`. At the default text size nothing moves.
- **Override change:** a caller's `h-*` no longer replaces these defaults, because `h-*` and `min-h-*` are separate tailwind-merge groups; pass `min-h-*` to change the floor.
- Avatar initials, the AvatarGroup `+N` count and the compact Pagination readout no longer set `allowFontScaling={false}`. Avatar labels scale as far as the fixed circle allows (`resolveAvatarLabelFit`), then shrink to fit.
- TimePicker wheel rows are fixed points the snap maths reads, so their text caps at `TIME_PICKER_ROW_MAX_FONT_SIZE_MULTIPLIER` (1.5).
- `Screen.Navbar.Title` and `.Subtitle` cap at `SCREEN_NAVBAR_MAX_FONT_SIZE_MULTIPLIER` (1.15), so a stacked title and subtitle stay inside the fixed navbar row under every design-system style.
