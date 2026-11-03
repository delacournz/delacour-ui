---
"@delacour/react-native-ui": patch
---

`Avatar` scales a bundled image (`source={require(...)}`) to fill the face. The image slot adds `size-full`, because `inset-0` does not override the width and height a bundled asset brings, so a large asset was clipped.
