---
"@delacour/react-native-ui": minor
"@delacour/react-native-bottom-sheet": minor
"delacour": patch
---

Move to Expo SDK 58: React Native 0.88, React 19.3, Gesture Handler 3

The peer floors are now `react-native >=0.88` and `react-native-gesture-handler >=3.3`. React Native
0.88 types its components through the strict API by default, so every ref is typed as the host
instance it receives — `ViewInstance`, `TextInputInstance`, `ScrollViewInstance` — rather than as
the component, and `ScreenScrollViewRef` is now `ScrollViewInstance`. Those types do not exist
before 0.88. The sheet's and the drawer's pans keep the builder API under Gesture Handler 3's
`LegacyPanGesture` type. The CLI's
`verify:expo` scaffolds against SDK 58.
