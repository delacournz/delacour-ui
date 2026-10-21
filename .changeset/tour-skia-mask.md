---
"@delacour/react-native-ui": patch
---

`Tour` draws its dimmed mask with Skia instead of react-native-svg: a window-sized rect with the spotlight clipped out, its rounded-rectangle hole derived on the UI thread from the existing shared values rather than rebuilt as a path string every frame. `@shopify/react-native-skia` is now a peer of `Tour`. `resolveMaskHole` is exported; `buildMaskPath` is deprecated and no longer used by the tour.

Between steps the hole now crossfades — the old one fades closed while the new one opens — instead of sliding across the screen, and the card stays mounted and glides to its new place instead of blinking out and fading back in. Under reduce motion the card jumps; the hole still fades. Opening the tour now has an entrance: the dim fades up around the first hole and the card follows a beat later, rising a few points into place (reduce motion keeps the fade and drops the rise). `TOUR_CARD_FADE_MS` is now 240. `TOUR_HOLE_FADE_MS`, `TOUR_ENTER_MS`, `resolveTourHoleFadeDuration`, `resolveTourCardEntrance` and `isSameHoleRect` are exported.
