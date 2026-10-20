---
"@delacour/react-native-ui": patch
---

`ListGroup.Item` renders a plain view when it has neither `onPress` nor `onLongPress`, so a static row is no longer announced as a button and runs no press feedback. Rows with a handler keep button semantics, disabled ones included.
