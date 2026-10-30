---
"delacour": minor
---

Add `prefix` to `native-components.json`: `add` and `update` rename every `DelacourUI` display name and thrown-message tag to it, and `DelacourProvider` to `<prefix>Provider` — `"prefix": "UI"` gives `UI.Flow.Provider` and `UIProvider`. `init` and `doctor` name the provider the same way.

`add` now installs the plain npm packages the components use (tailwind-variants, tailwind-merge, cn, tailwindcss, the icon set) at the ranges `@delacour/react-native-ui` declares, instead of npm's latest. tailwind-variants 4.0.0 broke every copied `*.variants.ts`.
