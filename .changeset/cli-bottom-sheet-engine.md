---
"delacour": patch
---

`add bottom-sheet` installs the engine instead of the library it replaced: `@delacour/react-native-bottom-sheet` from npm, and `react-native-teleport` through `expo install`, because it ships a Fabric portal view and needs a rebuild. `@gorhom/bottom-sheet` has left the install map, `doctor` watches `react-native-teleport` for a duplicated copy in a monorepo, and its New Architecture failure now names `BottomSheet`, whose portal does not render on the old one.
