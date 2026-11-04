---
"@delacour/react-native-ui": patch
---

`Avatar.Badge` draws the presence dot when its children are `0` or `""`, such as `{unread && <Badge />}` with no unread items, instead of throwing on a raw string in a `View`.
