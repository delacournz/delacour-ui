---
"@delacour/react-native-ui": patch
---

`TextAnimation` fixes for first-frame painting, negative numbers and font scaling:

- `Rolling` picks its roll direction from the magnitude, so a negative number such as −19 → −20 rolls the short way.
- New reveal text holds its start until the clock has rewound, so it never paints a frame fully shown before it reveals.
- A `Rotating` swap holds its start until progress has rewound, so the arriving phrase never flashes in fully shown.
- `Rolling` and `Rotating` cap font scaling at `TEXT_MAX_FONT_SIZE_MULTIPLIER` by default, like the other parts.
