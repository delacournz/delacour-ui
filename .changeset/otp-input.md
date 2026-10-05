---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `OtpInput`, a one-time code or PIN drawn as a row of cells over one hidden `TextInput`, so the number pad, a paste, iOS's QuickType code from Messages and Android's SMS autofill all fill every cell at once. Every change is sanitised to `pattern` (`digits`, `alphanumeric`, `alphabetic` or a one-character `RegExp`) and cut to `length`; `onComplete` fires once per transition to a full code with a `success` haptic. `groupSize` draws separators between groups, or write the anatomy out with `OtpInput.Group`, `OtpInput.Slot` and `OtpInput.Separator`. `isMasked` draws dots without switching off autofill, the caret holds still under reduce motion, the row is one accessible element, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add otp-input` copies it.
