---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Signature`, a pad to sign with a finger or a stylus. Strokes are drawn on the UI thread and smoothed into ink, a tap leaves a dot, and React renders once per stroke rather than per move. `Signature.Undo`, `.Redo` and `.Clear` disable themselves when they would do nothing, and `onRequestAlternative` adds a "Can't sign? Type your name" link for anyone who cannot draw. The value is plain JSON that re-fits a pad of another size; the ref adds `toSVG()` and `toPaths()`. Four sizes, two variants, read-only and disabled states, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add signature` copies it.
