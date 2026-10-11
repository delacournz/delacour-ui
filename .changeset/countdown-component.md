---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Countdown`, the time left until a fixed moment, read from the wall clock on every tick

It reads the clock rather than decrementing a counter, so it is right after the app was backgrounded or the
device slept, and it re-reads on returning to the foreground. Seconds round up — the final second shows `0:01`
and `onComplete` fires once at zero, re-arming when `to` moves into the future. `units` picks which units show,
the largest absorbing everything above it; `trim` drops leading zero units. `variant` is `segmented` — boxed
digits that slide per changed digit, with captions from `labels` — or `inline`, one tabular run. `urgentBelow`
turns the digits destructive. The `timer` label is coarse and names seconds only in the final minute.
`bunx delacour add countdown` copies it into a project.
