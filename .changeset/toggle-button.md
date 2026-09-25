---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ToggleButton`, a button that stays pressed. On its own it is controlled with `isSelected` and
`onSelected` or holds its own state from `defaultSelected`; inside `ToggleButton.Group` the group
owns one array of selected values, in `multiple` or `single` selection mode, with
`isSelectionRequired` to keep the last choice from being cleared. Each state draws with one of the
button's own variants (`default`, `outline`, `ghost`), so sizes, icons, loading and press feedback
are the button's. An attached group joins into one run like `Button.Group`; a detached one wraps
with a gap. The state is announced as a toggle button that is checked, or as a selected radio in a
single-choice group. `delacour add toggle-button` copies it in.
