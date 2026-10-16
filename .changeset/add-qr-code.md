---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `QRCode`: a string a camera can read, drawn as one `react-native-svg` path, with an optional
`QRCode.Logo` in the middle

The encoder is in-house and dependency-free — numeric, alphanumeric and UTF-8 byte modes, versions
1–40, levels L/M/Q/H — and is exported as `encodeQr` and `useQRCode` for custom renderers. Three
module styles (`square`, `rounded`, `dots`) keep the finders concentric; modules snap to whole device
pixels; a logo forces level H and grows the version until every block stays recoverable. The tile is
dark-on-light in both themes, and an inverted or low-contrast pair warns in development. The
registry now also skips `*.test-helpers.ts` and `*.fixtures.ts` alongside tests.
