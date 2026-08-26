# @delacour/biome-config — Shared Biome Configuration

The one place lint and format rules are written down. Every package in the
monorepo inherits them; no package restates a rule.

## Files

| File | What it holds |
| --- | --- |
| `root.jsonc` | The whole rule set — formatter, linter, assist, language settings |
| `react.jsonc` | `root.jsonc` plus the Tailwind CSS parser — **currently unused, see Known gaps** |
| `biome.jsonc` | This package linting itself |

## How it is wired

Inheritance is two hops, and only the first names this package:

```
biome.jsonc  (repo root, "root": true)
  └── extends ["./packages/biome-config/root.jsonc"]

packages/native-ui/biome.jsonc   "extends": "//",  "root": false
apps/playground/biome.jsonc      "extends": "//",  "root": false
packages/tsconfig/biome.jsonc    "extends": "//",  "root": false
packages/types/biome.jsonc       "extends": "//",  "root": false
packages/biome-config/biome.jsonc "extends": "//", "root": false
```

**`"extends": "//"` means "the repo root config", not a path into this package.**
A package config reaches these rules through the root, never directly — which is
why adding a second file here does not automatically reach anyone.

Each package config carries a `files.includes` narrowing the scope, and two
carry a deliberate `overrides` block:

- `native-ui` turns off `noDuplicateCustomProperties` for `src/styles/theme.css`,
  because light and dark redefine the same token names inside their own
  `@variant` scopes and Biome reads the file as one flat block.
- `playground` turns off `useFilenamingConvention` for `src/app/**`, because
  Expo Router derives route names from filenames and its conventions
  (`_layout`, `[id]`, `+not-found`) are not kebab-case.

Both carry the reason as a comment beside them. A new override needs one too.

## Rules worth knowing

- **Tabs, width 120, double quotes, semicolons always, ES5 trailing commas.**
  `indentWidth` is 2 but `indentStyle` is `tab`, so the width only affects how
  an editor renders a tab.
- **`organizeImports` runs as an assist action**, not a lint rule — it rewrites
  under `--write` rather than failing the build.
- **`noRestrictedImports` is the one rule with a semantic job.** It fails the
  build on Reanimated 4's deprecated worklet shims and names the replacement in
  the message:

  | Deprecated | Import instead, from `react-native-worklets` |
  | --- | --- |
  | `runOnJS` | `scheduleOnRN` |
  | `runOnUI` | `scheduleOnUI` |
  | `runOnRuntime` | `scheduleOnRuntime` |
  | `executeOnUIRuntimeSync` | `runOnUISync` |
  | `makeShareableCloneRecursive` | `createSerializable` |
  | `createWorkletRuntime`, `isWorkletFunction`, `WorkletRuntime` | import directly |

  `runOnJS` and `runOnUI` are restricted from **both** `react-native-reanimated`
  and `react-native-worklets`, because the Reanimated shim forwards to exactly
  the call it replaces and importing it from either package would otherwise
  compile. `native-ui`'s `Pressable` documentation names this rule as the reason
  the deprecated forms cannot regress quietly — do not relax it.
- **`noExplicitAny` is `warn`, not `error`**, and the repo standard is stricter
  than the linter: no `any`, discriminated unions instead. The warning is a
  backstop, not the policy.
- **`useFilenamingConvention` is `error`.** Kebab-case throughout —
  `bottom-sheet-scroll-view.tsx`, never `BottomSheetScrollView.tsx`. The Expo
  Router carve-out above is the only exemption.
- **`useExhaustiveDependencies` is `warn`**, because a Reanimated shared value is
  a stable reference the rule cannot see through.

## Commands

```bash
bun run check              # biome check, from any package
bun run check --write      # apply fixes and organize imports
bun run check              # from the repo root, via turbo, across every package
```

`scripts/pre-commit-biome.ts` runs this on staged files at every commit — see the
root [AGENTS.md](../../AGENTS.md).

## Changing a rule

Edit `root.jsonc`. A rule that genuinely cannot hold in one package is turned off
in that package's `overrides` with a comment saying why, as the two above do —
never by copying the rule set.

Keep the `$schema` version in step with the `@biomejs/biome` devDependency at the
repo root. A schema ahead of the binary reports valid options as unknown.

## Known gaps

**`react.jsonc` is exported and shipped but nothing extends it.** It is
`root.jsonc` plus `css.parser.tailwindDirectives`, and the two packages that
need that parser — `native-ui` and `playground` — declare it inline in their own
`biome.jsonc` instead. So the setting is written in three places and the file
that exists to hold it is dead. Either point those two configs at it or delete
it; leaving it is the drift this package exists to prevent.
