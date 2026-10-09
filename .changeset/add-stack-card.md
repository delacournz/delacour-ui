---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `StackCard` — a deck taken one card at a time by throwing the top one off.

- Compound anatomy: `StackCard.Card`, `StackCard.Stamp`, `StackCard.Empty`, `StackCard.Actions` and `StackCard.Action`. The root sorts its children by type, and anything it does not recognise is a card.
- One shared value — the top card's offset — drives the drag, the tilt, the stamps and the cards behind, so nothing re-renders during a drag and the next card is already in place when the top one leaves.
- `directions` picks which ways a drag throws; a horizontal-only deck lets vertical scrolls through. A flick throws from a short drag, and a disallowed direction gives a little and returns.
- `layout` draws the cards behind as a `stack`, a `fan` or `flat`, `depth` of them. Only a window around the top card is mounted, so a deck of five hundred costs what a deck of five does.
- Undo brings the last card back from the side it left, and a controlled deck that leaves `index` where it was declines the throw and the card flies back.
- Each allowed direction, and undo, is a screen-reader action on the top card, named by `directionLabels`; the cards behind are hidden. Under Reduce Motion a card fades rather than flies.
- `delacour add stack-card` copies it into a project.
