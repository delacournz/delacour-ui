---
"@delacour/react-native-bottom-sheet": patch
---

The sheet's Android back listener no longer re-subscribes when its methods change. An inline `onOpenChange` changed them on every parent render, and because `BackHandler` calls the newest listener first, the sheet's listener moved ahead of an overlay opened over it.
