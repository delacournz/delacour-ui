---
"@delacour/react-native-ui": patch
---

`TextAnimation` fixes for font scaling, retargeting and calm motion:

- `Typing`, `Counting` and the reveal give every text they draw the same font scale cap: cells, the block caret, whitespace and the copies that measure.
- `Counting` reserves its width from the number on screen. `Rolling` retargets each wheel from where it is now and rounds toward the roll's direction, so an interrupted roll keeps the new direction.
- When calm motion turns on, `Rolling` settles its wheels and `Rotating` returns to its first phrase.
- `Typing` calls `onPhraseTyped` for every phrase, even with no hold and no erase or when one frame finishes several, and stops counting the height of a removed phrase.
- A `line` reveal waits for its lines to be measured before it starts. `onFinished` fires once per play, also when calm motion is turned on or off, and setting `isActive` back to `true` plays the reveal again.
