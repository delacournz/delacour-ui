---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add component render tests with `@testing-library/react-native` under Jest. `delacour add --tests` now copies a component's render suite, the Jest setup that stubs its native modules and a `renderWithProviders` helper into a Jest project, adds the setup to the project's Jest config, and remembers the choice in `native-components.json`. Fix a disabled `Switch` flipping on a screen reader's activation or its `Field` label press.
