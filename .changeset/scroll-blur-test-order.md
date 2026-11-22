---
"@delacour/react-native-ui": patch
---

`scroll-blur`'s copied render test no longer leaks Reduce Transparency into the tests after it. It used to set the value on React Native's shared `AccessibilityInfo` mock and never put it back, so later tests failed whenever Jest ran them in another order. It now restores the preset's implementation.
