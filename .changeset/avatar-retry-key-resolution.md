---
"@delacour/react-native-ui": patch
---

`Avatar` retries its image when the entries of a multi-resolution list change their `width`, `height` or `scale`, and, for a list, when the avatar changes size. `imageProps` no longer accepts `src` or `srcSet`, which would override `source` and bypass the retry key.
