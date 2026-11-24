---
"@delacour/react-native-ui": patch
---

Timeline, Swipe, Sortable, Item and GridItem no longer hide their inner controls silently. Each warns in development when it is one accessibility element wrapping a control, and takes `accessibilityActions` / `onAccessibilityAction` so the control can be mirrored as a named action. Swipe publishes its tiles under stable names (`swipe-<side>-<index>`), routes caller actions to the row instead of its outer view, and offers `escape` to close an open row. `Sortable.Item` takes a `label`: the handle reads "Reorder {label}" and the actions "Move {label} up / down".
