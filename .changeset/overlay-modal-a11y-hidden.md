---
"@delacour/react-native-ui": patch
---

While a modal overlay is open, the app content behind it is hidden from screen readers (`accessibilityElementsHidden` on iOS, `importantForAccessibility="no-hide-descendants"` on Android), so VoiceOver and TalkBack focus stays inside the overlay.
