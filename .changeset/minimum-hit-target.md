---
"@delacour/react-native-ui": minor
---

Small controls now reach the minimum touch target (44pt, or Material's 48dp on Android with `DelacourProvider isMaterialHitTarget`) through `hitSlop`, with no pixel moved.

- `Pressable` hands its `hitSlop` to its tap and long-press gestures as well as the view. iOS reads the view's slop and Gesture Handler's Android orchestrator only the gesture's, so until now no `hitSlop` in the library reached past a control's bounds on Android. Now every bare glyph's does (the ✕ closes, the back button, the clear buttons, the Tree indicator). A pressable whose own root is `overflow-hidden` (`Button`, `Chip`, `Badge`, a Pagination item) still keeps its drawn size on Android, because the orchestrator does not descend into a clipping view for a touch outside it.
- New `resolveMinimumHitSlop`, `resolveMinimumHitTarget`, `normalizeHitSlop` in `pressable`, and `useMinimumHitSlop` / `MinimumHitTargetProvider` in `hooks/use-minimum-hit-target`.
- `sm` and `icon-sm` Buttons default to a 44pt target on iOS, which covers every toolbar, arrow and nav built on them.
- Dialog, Drawer and Popover close ✕, Screen back button, SearchBar and Combobox clear, Chip and Badge close, ColorPicker and Sketch swatches (capped at half their gap), Tree indicator, `sm` Tabs triggers, Table sort buttons and a standalone pressable Avatar grow their targets.
- A pressable Badge mirrors its ✕ as a `remove` accessibility action.
