---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Tour` — a guided walkthrough: the screen dims, a hole opens around one control, and a card beside it explains it.

- Wrap each control in a `Tour.Step` with an `order` and a `title`; the tour sorts the steps, measures the current one in window coordinates and re-measures on rotation. `onStepChange` fires first, so a target can be scrolled into view.
- The hole is an SVG cutout, `rect` or `circle`, that glides between targets on the UI thread and jumps under reduce motion. `shape`, `padding`, `radius` and `placement` are set on the tour and overridden per step.
- The card sits below the hole when it fits and above otherwise, centred and clamped to the safe area. Next, Back, Skip and Done, a "2 of 5" progress, and every label replaceable.
- A React Native `Modal` by default; `isInteractive` draws inside the tour's root and passes touches inside the hole through to the control.
- Open with `defaultOpen`, the `isOpen` triple or `useTour().start()`. `onFinish` and `onSkip` are where an app records that the tour was seen.
- Focus moves to the card on each step; VoiceOver's escape and Android back skip when dismissible.
- `delacour add tour` copies it into a project.
