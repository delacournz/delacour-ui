---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Dialog`, a centred card over a dimmed app that asks for a decision or a short input

`@delacour/react-native-ui/dialog`, and `delacour add dialog`. A compound root with `Trigger`,
`Content`, `Close`, `Header`, `Title`, `Description`, `Body` and `Footer`, drawn through the overlay
foundation, so it sits above every bottom sheet and the navigator's header. `isOpen` /
`defaultOpen` / `onOpenChange`, and `isDismissible={false}` for an alert dialog that only its own
actions close. Four sizes (`sm`, `md`, `lg`, `full`), a `plain` or `panel` footer that stacks on
`sm`, a card that lifts just clear of the keyboard, a fade-only entrance under Reduce Motion, and
accessibility focus that moves to the title on open and back to the trigger on close.

Also: `Overlay.Portal`'s missing-provider warning no longer names the npm package, so a copied
overlay carries no reference to it.
