---
"@delacour/react-native-ui": minor
---

`TextAnimation.Counting` and `TextAnimation.Rolling` take `prefix` and `suffix` props, which win over `format`'s. `Rolling` keeps each affix as one static cell, so a digit inside one (`/100`, `Q3 `) no longer rolls as a wheel.
