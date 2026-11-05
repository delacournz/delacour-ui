---
"@delacour/react-native-ui": patch
---

A controlled `Select` now clears its search query when the owner sets `isOpen` to false. Before, only a close from inside the sheet cleared it, so the next open showed the old filtered results.
