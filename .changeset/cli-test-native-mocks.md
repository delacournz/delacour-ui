---
"delacour": patch
"@delacour/react-native-ui": patch
---

The test kit no longer mocks native modules the project may not have. Skia, Pulsar, MapLibre,
`expo-linear-gradient` and `expo-blur` each have a mock of their own under `test/mocks/`, copied only
with a component that installs the module and added to Jest's `setupFiles` — so a project without
`chart` no longer fails every suite with "Cannot find module 'react-native-skia'".
