---
"@delacour/react-native-ui": patch
---

SectionProgress's pill now eases to each section's title width instead of jumping, and the titles slide out and in as the section changes — up for a later section, down for an earlier one. Reduce motion snaps the width and only fades. `useSectionProgress()` gains `index`, the active section's position.
