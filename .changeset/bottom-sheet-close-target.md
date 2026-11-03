---
"@delacour/react-native-ui": patch
---

`BottomSheet.Close` reaches the 44pt minimum touch target. `BOTTOM_SHEET_CLOSE_HIT_SLOP` is now 12 instead of 8: the 20pt default icon plus 12pt on each side is 44pt, where 8pt left a 36pt target.
