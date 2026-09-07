---
"delacour-react-native-charts": patch
---

Let `useSystemFont(undefined, size)` fall through to the platform font

`matchFont` spreads the style it is given over its own defaults, so passing
`fontFamily: undefined` erased the default instead of deferring to it and
threw "Value is undefined, expected a String" from inside Skia. The key is now
omitted when no family is given, which is what the documentation had always
shown.
