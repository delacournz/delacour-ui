---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `isMotionCalm` to `DelacourProvider`, and `useCalmMotion()`

An E2E build passes `isMotionCalm` and every decorative loop holds still, exactly as it does under
the OS reduce-motion setting — so a test runner that waits for the screen to settle before each
gesture (Argent, Detox, Maestro) never waits out a shimmering `Skeleton`. Motion that is the
behaviour keeps moving: `Spinner` and an indeterminate `Progress` are untouched.

`useCalmMotion()` (`@delacour/react-native-ui/hooks/use-calm-motion`) is the one question a
component asks before it loops — reduce motion, or the app asking — and `CalmMotionProvider` sets
the app's half for a hand-composed root. `Skeleton` and `Skeleton.Group` now read it.
