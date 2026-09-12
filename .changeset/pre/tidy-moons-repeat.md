---
"delacour-react-native-ui": patch
---

Fix the corner seam on a checked `Checkbox`

The fill sat exactly inside the border, so its outer curve and the border's inner
curve were the same curve rasterised on two layers. Antialiased independently
they under-cover where they meet, letting the box's own `bg-card` bleed through
as a dull arc at each corner — on iOS and Android alike, and at every size. The
straight edges are pixel-aligned, which is why only the corners showed it.

The fill now overlaps the border ring instead of meeting it: `-inset-px` reaches
past the padding box, and it wears the box's own corner rather than one a border
width tighter. There is no longer a shared edge to leave a seam.
