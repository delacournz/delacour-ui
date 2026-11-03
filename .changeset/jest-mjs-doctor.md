---
"delacour": patch
---

`doctor` warns when a Jest project using `chart` has no transform for `.mjs`. d3-shape 3.2.1 ships only `.mjs`, which `jest-expo`'s transform does not compile, so every suite reaching `chart` failed with "Must use import to load ES Module" — add `transform: { "^.+\\.mjs$": "babel-jest" }` to the Jest config.
