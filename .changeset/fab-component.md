---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Fab`, one primary action floating over the screen it belongs to. `placement` pins it to the
bottom start, centre or end of its nearest positioned ancestor, clear of the safe area, or leaves it
in flow when omitted; sizes are 44, 56 and 64pt from new `--spacing-fab-*` tokens, in `primary`,
`secondary`, `surface` and `destructive`. `isExtended` with `Fab.Label` makes a labelled stadium.
`Fab.Group` unfolds a dial of `Fab.Action`s over a scrim from one spring with a stagger, turns its
plus into a cross, unmounts the actions once closed, closes on the scrim, an action or Android back,
and takes `isOpen` / `defaultOpen` / `onOpenChange`. `delacour add fab` copies it in.
