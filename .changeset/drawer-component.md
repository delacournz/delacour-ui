---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Drawer`, a panel that slides in from an edge and covers the app until dismissed

`@delacour/react-native-ui/drawer`, and `delacour add drawer`. A compound root with `Trigger`,
`Content`, `Header`, `Title`, `Description`, `Body`, `Footer` and `Close`, drawn through the overlay
foundation, so it sits above every bottom sheet and the navigator's header. Four sides — `start` and
`end` swap under RTL, plus `top` and `bottom` — and four sizes as a capped fraction of the window.
Swipe toward the edge to dismiss: past 40% or on a fling it carries on from the finger, short of that
it eases back, a selection haptic marks the threshold and the scrim thins with the drag. The panel
pads the safe-area insets on its screen sides, fades instead of sliding under Reduce Motion, and
moves accessibility focus to the title on open and back to the trigger on close.
