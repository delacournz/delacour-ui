---
"@delacour/react-native-ui": patch
---

`Switch` fixes. The off-state knob colour changes: it is now `muted-foreground` (was `background`), so the knob reaches 3:1 contrast against the resting track in both themes, where it was 1.21:1 in light. A glyph inside the knob takes the track's on colour and does not read on the grey off knob, so keep knob glyphs decorative. `Switch.Thumb` stays hidden until both the track and the thumb have been measured, so an on switch no longer flashes its knob past the end of the track on mount. The `activate` accessibility action is listed on Android only, so the VoiceOver rotor no longer shows a literal "activate" entry. A `Switch.Thumb` written inside a fragment is found, so no second knob is drawn over it.
