---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ProgressButton`, a button held rather than tapped to confirm. A fill grows from the leading
edge over `holdDuration` (2000 ms by default) and `onComplete` fires only when it reaches the end,
read from the animation's own finish rather than a timer. Released early, the fill plays back at the
same rate, and a second press resumes from where it is. Every variant (`primary`, `secondary`,
`destructive`, `success`) rests on the same surface and carries its colour in a label drawn twice,
so the text stays readable across the wipe. It takes the button's sizes and a `pill` or `rounded`
shape, draws a tick on completion or a caller's `ProgressButton.Done`, rewinds by travelling back
with `isAutoReset` or a controlled `isCompleted`, steps in fifths under reduced motion, and
completes on a screen reader's activate. `delacour add progress-button` copies it in.
