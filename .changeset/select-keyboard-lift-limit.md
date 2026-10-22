---
"@delacour/react-native-bottom-sheet": minor
"@delacour/react-native-ui": patch
---

`BottomSheet` takes `keyboardLiftLimit`. Set to `"maxDynamicContentSize"`, a sheet sized to its content is lifted by a keyboard only as far as its cap, decided on the UI thread from the keyboard's first frame. `Select` opts in, so a searchable select no longer shoots to the top of the screen when the keyboard opens and then settles back to its cap.
