---
"@delacour/react-native-ui": minor
---

Overlay: new `useModalAccessibility` hook, and every modal container now goes through it. It makes a container modal to VoiceOver and gives it the escape scrub only while it is open and the top overlay, moves focus to its title or first item once it has entered, and returns focus to its trigger once it has gone — through `sendAccessibilityEvent` rather than the deprecated `setAccessibilityFocus`. The pure parts (`isModalOnTop`, `firstFocusTarget`, `resolveModalContainerAccessibility`) are exported too.

- Dialog, Drawer, Popover: a container under a popover or menu opened from it lets go of VoiceOver. Dialog and Drawer triggers report `expanded`.
- Menu and ContextMenu: VoiceOver's escape scrub closes the menu, focus lands on the first heading or enabled row, and returns to the trigger.
- Fab.Group: the escape scrub closes the dial, focus moves to the first action and back to the trigger.
- SectionProgress and SectionRail: focus returns to the pill or trigger on close.
- Tour: focus returns to the last step's target when the tour ends.
- ImageViewer: the escape scrub closes the viewer.
- BottomSheet: any modal sheet hides the app from screen readers, with or without a scrim. Pass `modal={false}` for a persistent sheet that should leave the app reachable; an `Overlay` with `enableTouchThrough` still does.
