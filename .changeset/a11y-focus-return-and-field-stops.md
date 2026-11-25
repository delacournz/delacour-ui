---
"@delacour/react-native-ui": patch
"@delacour/react-native-bottom-sheet": patch
---

Screen-reader fixes from device verification:

- `Pressable` with `accessible={false}` no longer exposes a `button` role, state or `activate` / `longpress` actions, and defaults `importantForAccessibility` to `"no"`. TalkBack stopped on these as unnamed buttons. This changes `Field`'s row, `Input.Group`'s box (and so `NumberInput`, `SearchBar`), `TagInput`'s box and `Post`'s card on Android: each is now skipped, and the control inside (or `Post`'s carrier) is the stop. A pressable `GridItem` or `Item` given `accessible={false}` loses its own `activate` / `longpress` the same way, so its press is touch-only; mirror it as a named `accessibilityActions` entry where it must stay reachable.
- `Field` keeps one row element for its whole life instead of swapping a `View` for a `Pressable` when a control registers, so its parts no longer remount. A `NumberInput`'s `Field.Error` is announced once instead of twice.
- `Menu` returns focus to its trigger on Android once the activity window has regained focus from the `Modal`'s window.
- `BottomSheet` returns focus to its trigger on Android once the app behind a modal sheet is visible to TalkBack again.
