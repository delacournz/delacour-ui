---
"@delacour/react-native-ui": patch
---

SectionProgress's pill now grows into its card as one surface — width, height and corners together, the list fading in as the card opens — instead of swapping a capsule for a scaled-in card. The card hugs a short list and stops at six rows, past which it scrolls. Reduce motion snaps the size and only fades the list.
