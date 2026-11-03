---
"@delacour/react-native-ui": patch
---

`Pressable asChild` given a text child now throws its documented error ("text and fragments cannot take props") instead of React's generic `Children.only` message.
