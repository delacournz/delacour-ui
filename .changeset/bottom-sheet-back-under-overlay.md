---
"@delacour/react-native-ui": patch
---

Android back closes an overlay open over a `BottomSheet`, not the sheet. Under an `OverlayProvider`, the sheet turns `closeOnBack` off while a modal or anchored overlay is open.
