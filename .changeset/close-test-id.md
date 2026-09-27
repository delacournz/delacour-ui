---
"@delacour/react-native-ui": patch
---

`Chip`, `Badge` and `Alert` take a `closeTestID` and forward it to the close control they compose in, so a test or automation can press "Remove" or "Dismiss" by id rather than by its label.
