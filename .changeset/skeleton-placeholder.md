---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Skeleton`, a placeholder for content that is still loading

It comes in three shapes — `rect`, `line` and `circle` — and either shimmers a glint across itself or pulses its opacity, on the UI thread. Pass the real content as children and the placeholder takes its exact size, then fades the content in when `isLoading` flips off with nothing moving. `Skeleton.Lines` draws a paragraph, and `Skeleton.Group` keeps every skeleton inside it on one clock and one loading flag. Motion stops under the OS reduce-motion setting, and a placeholder stays hidden from screen readers unless it has a `label`. `bunx delacour add skeleton` copies it in.
