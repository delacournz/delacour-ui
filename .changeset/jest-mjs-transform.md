---
"delacour": patch
---

`add --tests` on Jest now adds `transform: { "^.+\\.mjs$": "babel-jest" }` to the Jest config, and `doctor` warns when it is missing. d3-shape 3.2.1 ships only `.mjs`, which `jest-expo`'s transform does not compile, so every suite reaching `chart` failed with "Must use import to load ES Module".
