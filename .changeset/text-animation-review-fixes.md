---
"@delacour/react-native-ui": patch
---

`TextAnimation` fixes for font scaling, retargeting and calm motion:

- `Typing`, `Counting` and the reveal give every text they draw the same font scale cap: cells, the block caret, whitespace and the copies that measure.
- `Counting` reserves its width from the number on screen. `Rolling` retargets each wheel from where it is now and rounds toward the roll's direction, so an interrupted roll keeps the new direction.
- When calm motion turns on, `Rolling` settles its wheels and `Rotating` returns to its first phrase.
- `Typing` calls `onPhraseTyped` for every phrase, even with no hold and no erase or when one frame finishes several, and stops counting the height of a removed phrase.
- A `line` reveal waits for its lines to be measured before it starts. `onFinished` fires once per play, also when calm motion is turned on or off, and setting `isActive` back to `true` plays the reveal again.
- `Rolling` retargets a wheel whose direction flips on the same digit. `Rotating` aligns its phrases inside the reserved slot and starts over when its phrase list changes.
- The clock stops its frame callback once a run finishes.
- Rows follow the resolved text alignment, so `className` and an inherited alignment count. `capitalize` capitalizes each word, not each letter, in `Typing` and a `character` reveal. Empty lines from hard breaks keep their height.
- The block caret's fill is generated in every colour.
