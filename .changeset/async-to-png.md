---
"@delacour/react-native-ui": minor
---

`Signature` and `Sketch`'s `toPNG()` now return `Promise<string>`. react-native-skia 3.9 made `Image.encodeToBase64` asynchronous, and the peer range moves to `>=3.9.0` — `await` the call.
