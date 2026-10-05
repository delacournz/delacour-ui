---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `ScrollFade`, a gradient at a scrollable's edges while content runs past them

`@delacour/react-native-ui/scroll-fade` overlays any scrollable — a card row, a list in a `Card`, a
sheet body — and fades its start and end edges only while there is content past them, on either
axis. It reads a `ScrollSource` from `useScrollSource`, or needs no wiring at all inside a `Screen`.
The fade is a colour, so name the surface with `color`; `edges`, `size`, `fadeInDistance` and
`insetStart` / `insetEnd` tune it. The CLI registry gains the `scroll-fade` item.
