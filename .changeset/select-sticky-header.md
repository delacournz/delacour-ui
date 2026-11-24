---
"@delacour/react-native-ui": patch
---

`Select` pins its sheet header while the options scroll. The title, the close button and the search field stay at the top of a long list, and the rows pass under the opaque header. Sizing is unchanged. The header and the list take `${testID}-header` and `${testID}-list`.
