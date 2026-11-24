---
"@delacour/react-native-ui": minor
---

Make `Signature` usable without drawing. With `onRequestAlternative`, an empty pad is a screen-reader button: a double tap opens the typed-name route, and the pad lists a `type` custom action, whether it is empty or drawn. Without that route, an empty pad is announced as an image instead of having no role. On iOS, a double tap no longer draws a stray dot. The default toolbar now includes Redo between Undo and Clear. In development, an interactive `Signature` without `onRequestAlternative` warns once. A new `labels` prop, and a `signature` entry in `DelacourProvider`'s `labels`, cover every string the signature speaks or shows.
