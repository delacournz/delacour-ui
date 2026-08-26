# @delacour/tsconfig — Shared TypeScript Configuration

Three base configs. A package extends one by its file path; there is no
`exports` map, so the path is the file name.

## Files

| File | Extends | For |
| --- | --- | --- |
| `tsconfig.base.json` | — | Everything. Strictness, module resolution, the custom condition |
| `tsconfig.react-native.json` | `base` | A React Native package — `jsx: react-jsx`, `allowJs`, no ambient `types` |
| `tsconfig.react.json` | `base` | A DOM React package that emits to `dist/` — **currently unused, see Known gaps** |

## Who extends what

```
packages/native-ui   →  @delacour/tsconfig/tsconfig.react-native.json
packages/types       →  @delacour/tsconfig/tsconfig.base.json
apps/playground      →  expo/tsconfig.base            ← not this package
```

**The playground deliberately does not extend this package.** Expo's own base
carries the resolver settings its Metro pipeline expects, and overriding them
from here would be a second answer to a question Expo already answers. It sets
`strict` itself and adds two `paths` entries pinning `react-native` to the
workspace-root copy — Bun materialises a second copy under the app's own
`node_modules`, TypeScript treats the two paths as different modules, and
uniwind's `className` augmentation is applied to the root copy only. Without the
pin, `className` would not typecheck on a component resolved from the nested
copy. That comment lives in the app's `tsconfig.json`; keep it there.

## What `base` sets, and why it matters

- **`strict: true`** plus `strictNullChecks`, `noImplicitOverride`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`. The repo
  standard is stricter still: no `any`, discriminated unions for type-based
  shapes.
- **`moduleResolution: "bundler"`** — every consumer is bundled (Metro, Vite),
  none runs raw Node resolution, so subpath `exports` maps resolve the way the
  bundler will resolve them.
- **`customConditions: ["@delacour/source"]`** is what lets a workspace package
  be consumed as **source rather than as a build artefact**. `native-ui` ships
  raw `.tsx` with no build step, because Uniwind's transform has to run inside
  the consuming app's Metro pipeline — a precompiled build would arrive with its
  classNames already dead. This condition is how TypeScript follows the same
  path Metro does.
- **`composite: true`** in `base`, switched **off** in `native-ui` alongside
  `noEmit: true`. A package that emits nothing has no project references to
  build, and leaving `composite` on would demand a `tsBuildInfoFile` for output
  that never appears.
- **`skipLibCheck: true`** — the React Native and Expo type surfaces do not
  typecheck cleanly against each other, and this is not the repo's argument to
  have.

## Commands

```bash
bun run typecheck          # tsc --noEmit, from any package
bun run typecheck          # from the repo root, via turbo, across every package
```

Typecheck also runs as a **pre-push** hook — see the root [AGENTS.md](../../AGENTS.md).

## Changing a config

Edit the file here. A package needing one different option sets it in its own
`tsconfig.json` `compilerOptions`, as `native-ui` does with `composite: false`
and `types: ["bun"]` — never by copying a base config.

Adding a file here means adding it to `files` in `package.json`, or it will not
be published.

## Known gaps

**`tsconfig.react.json` is shipped but nothing extends it.** It targets a DOM
React package emitting to `dist/` — a shape no package in this repo currently
has. Keep it only if a web package is coming; otherwise it is a config that will
be stale by the time anyone reaches for it.
