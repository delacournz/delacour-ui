---
"@delacour/react-native-ui": patch
---

Screen readers stay inside the top modal overlay. The top open modal's portal frame is modal for VoiceOver, and every overlay drawn under it is hidden from VoiceOver and TalkBack, so a dialog opened over another dialog no longer leaves the lower one reachable. `topModalOverlay` and `isBelowTopModal` are exported from `overlay`.
