---
"@delacour/react-native-ui": patch
"@delacour/react-native-charts": patch
---

Fix Skia canvases — `Chart`, `Sketch` — that came up blank after a JS reload (the dev menu's, or `Updates.reloadAsync` after an OTA update) until something re-rendered them. Skia restarts its canvas ids at 1000 in every runtime while its native registry still holds the old runtime's ids as torn down; each runtime now starts its ids in a fresh range.
