---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ScrollText`, text that resolves unit by unit as the screen scrolls past it. Four effects —
`colour`, `fade`, `rise` and `highlight` — over a `word`, `character` (by grapheme) or `line` split,
staggered by `overlap` inside a viewport `window`. Progress comes from the enclosing `Screen`, from
any scroll view's offset (read against its own bounds with `viewport`), or from a shared value
already in 0..1. Every frame runs on the UI thread and writes only opacity, transform and colour;
un-revealed text never drops below a legible floor, reduce motion and `isMotionCalm` show it fully
revealed, and the block reads as one accessibility element with the whole string.
`delacour add scroll-text` copies it in.
