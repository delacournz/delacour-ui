---
"@delacour/react-native-ui": minor
---

Toast: `useToastOffset` follows a shared value. The hook now registers shared values of its own and follows a caller's shared value into them on the UI thread, so a tab bar can keep its measured height in a shared value, write it with `.set()` in `onLayout`, and lift the toasts with no re-render — while `null` on focus loss still slides them down and back up.

Fixes:

- A toast shown again with its `id` while leaving is no longer removed by the old exit, and `onHide` fires only for the exit that ran (`remove` takes an optional `revision`).
- A disabled `Toast.Action` is no longer offered to a screen reader and cannot run.
- The auto-hide clock waits out the entrance stagger, so a toast late in a batch — or updated while it waits — is shown for its full duration.
- A toast hidden while still queued leaves the store at once and calls its `onHide`.
- A VoiceOver double-tap on the card runs its action.
- A toast revived after a swipe comes back on screen instead of staying where the swipe left it.
