---
"@delacour/react-native-ui": patch
---

`Input.Group` now bleeds only its outermost blocks through the box padding: the first `start` block and the last `end` block. Before, every block in a section took the negative margin, so a second block was pulled over its separator.
