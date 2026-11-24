---
"@delacour/react-native-ui": patch
---

`Select` and `Combobox` pin their sheet header while the options scroll. The title, the close button, the search field (and in `Combobox` the chips and result count) stay at the top of a long list, and the rows pass under the opaque header. The header pins exactly where it rests, and sizing is unchanged. The header and the list take `${testID}-header` and `${testID}-list`.
