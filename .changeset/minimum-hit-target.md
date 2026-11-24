---
"@delacour/react-native-ui": minor
---

Small controls now reach the minimum touch target (44pt, or Material's 48dp on Android with `DelacourProvider isMaterialHitTarget`) through `hitSlop`, with no pixel moved.

- `Pressable` hands its `hitSlop` to its tap and long-press gestures as well as the view. On iOS a view-only slop was failed as outside the bounds, so every existing slop in the library (Pagination `sm`, Chip, Post, Radio, Alert and Toast close, Attachment actions, NumberInput `sm`) now works there too.
- New `resolveMinimumHitSlop`, `resolveMinimumHitTarget`, `normalizeHitSlop` in `pressable`, and `useMinimumHitSlop` / `MinimumHitTargetProvider` in `hooks/use-minimum-hit-target`.
- `sm` and `icon-sm` Buttons default to a 44pt target, which covers every toolbar, arrow and nav built on them.
- Dialog, Drawer and Popover close ✕, Screen back button, SearchBar and Combobox clear, Chip and Badge close, ColorPicker and Sketch swatches (capped at half their gap), Tree indicator, `sm` Tabs triggers, Table sort buttons and a standalone pressable Avatar grow their targets.
- A pressable Badge mirrors its ✕ as a `remove` accessibility action.
