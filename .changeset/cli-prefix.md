---
"delacour": minor
---

Add `prefix` to `native-components.json`: `add` and `update` rename every `DelacourUI` display name and thrown-message tag to it, and `DelacourProvider` to `<prefix>Provider` — `"prefix": "UI"` gives `UI.Flow.Provider` and `UIProvider`. `init` and `doctor` name the provider the same way.
