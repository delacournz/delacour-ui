---
"@delacour/react-native-ui": patch
---

`Select.Trigger asChild` no longer passes `disabled={false}` to its child when the select is enabled, so a child that is disabled on its own (`<Button isDisabled>`) stays disabled and never opens the sheet.
