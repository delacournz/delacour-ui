---
"@delacour/react-native-ui": patch
---

Fix form controls reacting while disabled, found by their new render tests:

- `Checkbox` no longer flips when its `Field` row is pressed while the checkbox is disabled.
- `OtpInput` no longer takes focus from a `Field` row press while it is disabled.
- `NumberInput.Field` and `Slider.Thumb` ignore screen-reader increment and decrement actions while disabled.
- `Slider` no longer calls `onChange` on mount, and calls it once per screen-reader step instead of twice.
