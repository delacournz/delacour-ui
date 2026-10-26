---
"@delacour/react-native-ui": patch
---

`Input` takes the enclosing `Field.Label`'s text as its `accessibilityLabel` when none is given, so `<Field><Field.Label>Email</Field.Label><Input /></Field>` announces "Email" to a screen reader instead of an unnamed text field. An explicit `accessibilityLabel` still wins. `Textarea` inherits it.
