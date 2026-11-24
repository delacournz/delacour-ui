---
"@delacour/react-native-ui": patch
---

`Button`, `Chip` and `Badge` roots no longer clip (`overflow-hidden` is gone), so their `hitSlop` now lands on Android, where Gesture Handler never descends into a clipping view for a touch outside it. A press still fades the root's own opacity, which needed no clip.

- Chip's close glyph now reaches past the chip's edge, by up to half the gap between chips, on both platforms.
- Badge's ✕ slop now reaches the badge's own edge on the top, bottom and trailing sides (its target is the badge's height); towards the label it stays at half the gap.
- A child that relied on the root's clip (an image or gradient filling a rounded Button or Chip) now overflows its corners. Pass `className="overflow-hidden"` to restore the clip, at the cost of the Android slop.
