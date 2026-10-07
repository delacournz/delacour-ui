---
"@delacour/react-native-ui": minor
"delacour": minor
---

`cn()` now runs on [`cn`](https://github.com/shadcn-ui/cn) instead of `clsx` + `tailwind-merge`: the same output (held to tailwind-merge's on every variant class), much faster on repeated render calls. `clsx` is no longer a dependency; `tailwind-merge` stays, as `tailwind-variants`' peer for `tv()`. Components added with `delacour add` now install `cn`.
