---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Alert`, a status message on a `Surface`

Five statuses — `default`, `info`, `success`, `warning` and `destructive` — pick the leading glyph
and colour it and the title from one token, while the description stays muted. `variant="soft"`
washes the surface in the status's soft fill; `variant="surface"` keeps a neutral fill that steps
off whatever it sits in. Three sizes move padding, type and glyph together. Composed from
`Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`, `Alert.Action` and
`Alert.CloseButton`; `isDismissible` adds the close control, uncontrolled or through `isOpen` /
`onOpenChange`, and `useAlert().dismiss` closes it from an action. `bunx delacour add alert` copies
it into a project, with `surface` alongside.
