---
"@delacour/react-native-ui": patch
---

`Avatar.Group` counts each avatar inside a fragment as its own face, so `max` and the `+N` tile work when the faces come from a fragment or a mapped list wrapped in one. The new `flattenAvatarChildren` helper opens fragments at any depth and keys each face as a `[fragmentKey, faceKey]` JSON pair, so keys stay unique however the fragments are keyed.
