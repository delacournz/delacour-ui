---
"@delacour/react-native-ui": patch
---

Badge, Carousel, Post and Message keep their inner controls reachable by a screen reader. A Badge the caller makes `accessible` offers its close as a `remove` action; Carousel's adjustable moves off the viewport onto a small position element, so slide text is no longer one merged name and controls inside a slide are reachable; a pressable Post's card press reaches VoiceOver and TalkBack through `Post.Body`'s `activate` / `longpress` actions, and its more toggle is named "Show more" / "Show less" with `expanded`; a merged Message hides its drawn Retry, which the root already offers. New `lib/interactive-child` warns in development when an `accessible` container wraps a control.
