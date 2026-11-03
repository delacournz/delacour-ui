---
"@delacour/react-native-ui": patch
---

`DatePicker.Trigger` reads a read-only picker as enabled. Only `isDisabled` sets `accessibilityState.disabled` now, so VoiceOver no longer reads a read-only value as dimmed. A trigger that cannot open drops the "Opens calendar" hint, its press handler and its press feedback.
