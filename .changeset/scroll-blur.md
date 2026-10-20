---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ScrollBlur` — a progressive blur at a scrollable's edges that keeps floating controls legible over any background, falling back to a gradient wash with no engine or with Reduce Transparency on. Ships with `ScrollBlurLayerProvider`, the `expo/blur-layer` engine (`ExpoBlurLayer`, behind the new optional peer `expo-blur`), `useReduceTransparency` and `withAlpha` in `lib/color`. The CLI gains `scroll-blur`, `blur-layer` and `use-reduce-transparency` registry items, and classifies `expo-blur` as an `expo install` package.
