---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `TextAnimation` — five ways a piece of text or a number arrives, on one clock.

The root reveals a string by word, character or line with a fade, slide or scale, staggered
forward, in reverse, from the centre or in a seeded random order. `TextAnimation.Typing` types a
phrase or cycles several with a bar or block caret, `TextAnimation.Rotating` swaps one word in
place inside a sentence, `TextAnimation.Counting` tweens a formatted number on the UI thread, and
`TextAnimation.Rolling` rolls an odometer whose wheels take the short way round. Nothing reflows
while it plays, a screen reader hears the final text once, and under reduce motion every part shows
its final text on the first frame.
