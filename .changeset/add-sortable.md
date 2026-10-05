---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Sortable` — a vertical list the user reorders by dragging.

- Rows move by transform on the UI thread, so a drag renders nothing; `onReorder(order, { id, from, to })` fires once, after the row lands, and the transforms clear in the commit that renders the new order.
- `activation="handle"` drags from `Sortable.Handle`; `"long-press"` lifts the whole row after `longPressDelay`. A row changes slot when its edge crosses the next row's midpoint, at any heights.
- `isPinned` rows never move and the others reorder around them; `isDisabled` rows cannot be lifted.
- `scrollRef` auto-scrolls the enclosing scroller near its edges. `haptic` plays one feedback on lift and one per slot passed.
- Screen readers get Move up / Move down actions and "Position 2 of 5", with the new position announced.
- `reorderItems` and `useSortableItem` are exported. `delacour add sortable` copies it into a project.
