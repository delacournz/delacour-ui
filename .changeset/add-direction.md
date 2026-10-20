---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Direction`, a per-subtree LTR/RTL wrapper with `useDirection` and `useDirectionSign`.

- `<Direction dir="rtl">` mirrors its subtree on the next frame — rows reverse, `start`/`end` insets swap — with no restart and no remount, and nests: an inner `<Direction dir="ltr">` holds a phone number's order inside an RTL card.
- Uniwind's `rtl:` and `ltr:` variants resolve against the nearest `Direction`, not the app.
- `useDirection()` and `useDirectionSign()` report the direction to gesture and `translateX` maths. Outside any `Direction` they fall back to `I18nManager.isRTL` rather than throwing.
- Worklet-safe helpers — `resolveDirection`, `directionSign`, `physicalSide`, `mirrorX`, `logicalDelta` — for code that runs on the UI thread.
- `delacour add direction` copies it into a project.
