---
"@delacour/react-native-ui": minor
---

Looping motion can be paused, and holds still while a screen reader is on (WCAG 2.2.2). A new `useLoopingMotion` hook (`hooks/use-looping-motion`, with the pure `lib/looping-motion`) holds a loop under calm motion or a screen reader — at its rest state — and gives the user a pause that freezes it in place. `Marquee` (and `Marquee.Group`), `TextAnimation.Typing` / `.Rotating`, `AnimatedBadge`'s pulse, `Flow`'s marching edges, `CircularText` and `Carousel` autoplay take `isPaused`, `defaultPaused` and `onPausedChange` for an app's own pause control, and offer "Pause animation" / "Resume animation" accessibility actions where they are already one accessible element. The strings are `labels.motion`. `Carousel` autoplay now shares the hook's one screen-reader subscription.

`Collapsible` honours calm motion (a short timing instead of the spring), and `ContextMenu.Preview` reads `useCalmMotion`, so `DelacourProvider`'s `isMotionCalm` reaches it.
