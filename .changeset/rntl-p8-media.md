---
"@delacour/react-native-ui": patch
---

`Post.Author` and `Post.Community` hide their `Avatar` from assistive technology. The parent's one-stop label already names the person or community, so the labelled avatar inside it was announced a second time on Android.
