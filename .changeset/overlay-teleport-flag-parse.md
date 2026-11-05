---
"@delacour/react-native-ui": patch
---

Drop the `unique symbol` annotation on the overlay teleport flag. A `const` initialised with `Symbol.for` already has a unique symbol type, and the annotation broke source scanners that parse the file with a plain JavaScript grammar.
