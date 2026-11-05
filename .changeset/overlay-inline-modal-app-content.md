---
"@delacour/react-native-ui": patch
---

An inline modal, or one in a custom host, no longer makes `OverlayProvider` hide the app content from VoiceOver and TalkBack. The content `View` can hold that modal, so hiding it hid the modal too. Stacking and the back button are unchanged.
