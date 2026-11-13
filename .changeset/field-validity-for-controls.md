---
"@delacour/react-native-ui": minor
---

Field: a control inside a `Field` now tells a screen reader everything the field shows. `Field` takes `isRequired`, and the control's name becomes "Email, required"; `isInvalid`, the `Field.Error` text and the `Field.Description` text become its hint — "Invalid: Enter a valid email. We never share it." React Native has no `aria-invalid`, `aria-required` or `aria-describedby`, so speech is the channel. On Android a label made of elements is linked with `accessibilityLabelledBy`.

`Field.Label` steps out of the accessibility tree once a control takes its text as its name, so it is no longer read twice, and draws the required asterisk. `Field.Legend` is a header. `Field.Error` announces through one mechanism — a polite live region — and no longer carries `role="alert"`.

New: `useFieldControlAccessibility` and the pure `resolveFieldControlAccessibility` / `resolveFieldLabelHidden` (from `@delacour/react-native-ui/field`), and `FIELD_ACCESSIBILITY_LABELS` for localising the spoken words.

Wired: Input, Textarea, OtpInput, NumberInput, Select, SearchBar, Slider, Switch, Checkbox, Radio, TimePicker, TagInput, Signature and Feedback.Field. `Input`, `OtpInput` and `Select` gain `isRequired`; `Feedback.Field` gains `isInvalid` and `isRequired`; `TimePicker.Wheel` gains `accessibilityLabel`, `accessibilityHint` and `isRequired`. NumberInput and SearchBar no longer pass the field's label down as an explicit name, which had kept the label from being claimed.

Removed, replaced by the shared resolver: `resolveInputAccessibilityLabel` (input), `resolveAccessibilityLabel` (otp-input) and `resolveCheckboxAccessibilityLabel` (checkbox).
