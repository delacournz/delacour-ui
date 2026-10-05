---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `FlipCard` — two faces of one card and a turn between them

`FlipCard.Front` sits in flow and sizes the card, `FlipCard.Back` fills it, and `FlipCard.Trigger`
turns it under every trigger. `trigger` is a discriminated union: `"press"` (a tap anywhere),
`"swipe"` (a drag that scrubs the turn, rubber-bands past either rest and settles on the nearer face
or the way it was flicked; `swipeDistance` exists only here) and `"manual"` (only `face`, the ref's
`flip()` / `flipTo()` or a trigger). The face is state and the rotation follows it: the hidden face
leaves the accessibility tree and stops taking touches the moment a turn is committed, which face is
drawn is decided by the angle rather than `backfaceVisibility`, the settled face is announced, and a
gesture card always offers an `activate` action. Under reduce motion or `isMotionCalm` the faces
crossfade instead of turning. `delacour add flip-card` installs it.
