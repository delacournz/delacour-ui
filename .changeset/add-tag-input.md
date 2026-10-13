---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `TagInput` — free-form tags typed into one field box, each a removable chip

Return or a delimiter commits the text as a chip and keeps the keyboard up; a paste holding
delimiters lands as several tags. Duplicates, a `max` and a `validate` hook refuse tags through
`onReject` with a reason, and `allowOverflow` accepts past `max` while marking the field invalid.
Backspace on an empty field arms the last chip, and a second removes it. The box is `Input`'s, it
joins an enclosing `Field`, and tags and draft are each controlled or uncontrolled.
