---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add the scroll family's shared base: `useScrollSource`, `scroll-maths` and `scroll-edges`

`@delacour/react-native-ui/hooks/use-scroll-source` gives any scrollable a `ScrollSource` — its
offset, content size and layout size as shared values, plus its axis — and the props to spread onto
it; `ScrollSourceProvider` shares one and `useResolvedScrollSource` is how an effect finds it.
`lib/scroll-maths` holds the worklet maths an edge affordance needs (`scrollEdgeOpacity`,
`scrollProgress`, `readScrollEvent`) and `lib/scroll-edges` the band geometry. A `Screen` now
publishes its own body as a scroll source, so scroll-linked effects inside one need no wiring. The
CLI registry gains the three items, and `screen` now depends on `use-scroll-source`.
