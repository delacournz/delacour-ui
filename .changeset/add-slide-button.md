---
"@delacour/react-native-ui": minor
---

Add `SlideButton`, a control confirmed by dragging a handle across a rail

The handle tracks the finger exactly and only the release is sprung. A release confirms past
`threshold` (0.9 by default) with a small look-ahead, but a flick from halfway never does, and
`threshold={1}` demands the far end. Controlled, the handle waits at the end until `isCompleted`
answers; a rejected `onComplete` promise takes it home. Variants `secondary`, `destructive` and
`success`; sizes match `Button`. Screen readers confirm with one named action, and the control
flips under RTL.
