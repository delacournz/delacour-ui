---
"@delacour/react-native-ui": patch
---

Export every public variant axis from its component's entry point. `BADGE_MATERIALS` / `BadgeMaterial`, `BUTTON_MATERIALS` / `ButtonMaterial`, `SURFACE_MATERIALS` / `SurfaceMaterial` and `SCROLL_SHADOW_ANCHORS` / `ScreenScrollShadowAnchor` were declared but only reachable by importing a component's internal files; `@delacour/react-native-ui/text-animation` now also exports `TextAnimationEffectKind`, `TextAnimationCaretKind`, `TextAnimationSlideFrom` and a new `TEXT_ANIMATION_SLIDE_DIRECTIONS`. A package test now fails for any axis left unexported.
