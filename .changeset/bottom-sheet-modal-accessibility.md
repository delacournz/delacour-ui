---
"@delacour/react-native-bottom-sheet": minor
---

BottomSheet is a modal surface for screen readers whenever it is open, with or without an `Overlay`. VoiceOver's escape scrub closes a dismissible sheet from anywhere in the panel (it was only on the handle, and closed a non-dismissible sheet there). Once the sheet settles open, focus moves to its `Title` (or the panel), and once it settles closed, back to the `Trigger` that opened it. `Trigger` reports `expanded` while open. Only the top sheet of a host holds focus. A new root `modal` prop (default `true`) opts a persistent sheet out, and an `Overlay` with `enableTouchThrough` makes the sheet non-modal on its own.
