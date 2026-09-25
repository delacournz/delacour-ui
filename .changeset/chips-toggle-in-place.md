---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Chip`, an interactive pill for filters, tags and removable tokens

What a chip does follows from its props. With no handler it is a plain tag; with `onPress` it is
a button; with `isSelected`, `defaultSelected` or `onSelectedChange` it is a filter that toggles —
controlled or uncontrolled, with a `selection` haptic, announced to a screen reader as selected or
not. `onClose` adds a remove control with a press of its own, so removing a chip never also toggles
it.

```tsx
import { Chip } from "@delacour/react-native-ui/chip";

<Chip isSelected={open} onSelectedChange={setOpen} variant="outline">
  <Icon icon={IconFilter1} />
  <Chip.Label>Open only</Chip.Label>
</Chip>;
```

It shares `Badge`'s colours, sizes and tones — an unselected `soft` or `outline` chip is painted
exactly as the badge beside it — and selection swaps in a solid fill in the chip's colour without
changing its size, so a wrapping row never reflows. Parts: `Chip.Label`, `Chip.StartContent`,
`Chip.EndContent`, `Chip.CloseButton`, and `useChip()` for a child that restyles itself on
selection.

`bunx delacour add chip` copies it in, along with `badge`, whose tones it reads.
