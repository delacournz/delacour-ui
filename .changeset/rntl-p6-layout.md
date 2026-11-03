---
"@delacour/react-native-ui": patch
---

Tabs: a bar with no `Tabs.Content` and no `defaultValue` now opens on its first tab, as documented. It used to start with nothing selected, because its order was still empty when the initial value was seeded.
