---
"@delacour/react-native-ui": patch
"@delacour/react-native-charts": patch
---

Fix Skia canvases — `Chart`, `Flow`, `SectionProgress`, `Signature`, `Sketch`, `Tour` — that came up blank after a JS reload (the dev menu's, or `Updates.reloadAsync` after an OTA update) until something re-rendered them. `react-native-skia` 3.7.3 allocates canvas ids natively, unique for the life of the process, so the optional `react-native-skia` peer now needs `>=3.7.3`.
