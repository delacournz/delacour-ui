---
"@delacour/react-native-ui": minor
---

`Screen.Footer` takes `keyboardOffset`: while the keyboard is open, a sticky footer lifts that many extra points, so it sits on top of a bar riding the keyboard (a form's previous / next / done toolbar) instead of behind it. The footer publishes the value on the screen context, and a `keyboardAware` `Screen.ScrollArea` adds it to the focused field's clearance.
