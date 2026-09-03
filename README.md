# Delacour UI

A React Native component library and the Expo app that exercises it.

Styling is [Uniwind](https://github.com/kirillzyusko/uniwind) — Tailwind v4 for
React Native. Interaction is Reanimated and Gesture Handler. Haptics are Pulsar.
The library takes no framework dependency and no third-party component kit.

## Packages

| Package | Description |
| --- | --- |
| [`delacour-react-native-ui`](packages/native-ui) | The component library — 19 components, subpath exports, no build step |
| [`@delacour/playground`](apps/playground) | Expo app rendering every component on a device |
| [`@delacour/biome-config`](packages/biome-config) | Lint and format rules |
| [`@delacour/tsconfig`](packages/tsconfig) | Shared TypeScript configs |
| [`@delacour/types`](packages/types) | Shared utility types |

## Getting started

Requires [Bun](https://bun.sh) 1.3+ and, for the playground, Xcode or Android
Studio. The playground uses `expo-dev-client` and will not run in Expo Go.

```bash
bun install
cd apps/playground
bun expo prebuild          # first run only — generates ios/ and android/
bun ios                    # or: bun android
```

`bun dev` from the repo root starts Metro on port 8088 for an already-built app.

## Working on the library

```bash
bun run typecheck          # tsc --noEmit everywhere
bun run check              # Biome
bun test                   # unit tests
```

The library's tests cover pure logic only — React Native ships Flow-typed source
Bun's transpiler cannot parse. Anything that needs a renderer is verified in the
playground on a simulator.

## Documentation

Every package carries an `AGENTS.md`, and it is the real documentation — the
design decisions, the constraints, and the reasoning behind them.

- [Repo conventions](AGENTS.md) — workspaces, the version catalog, hooks, commits
- [`native-ui`](packages/native-ui/AGENTS.md) — the library's rules, plus a file
  per component under [`src/components`](packages/native-ui/src/components)
- [`playground`](apps/playground/AGENTS.md) — routes, Metro, adding a gallery

## Licence

MIT. Three packages are published — [`delacour`](https://www.npmjs.com/package/delacour), the CLI,
[`delacour-react-native-ui`](https://www.npmjs.com/package/delacour-react-native-ui), the components,
and [`delacour-react-native-charts`](https://www.npmjs.com/package/delacour-react-native-charts), the
charting engine. Everything else in the workspace is private. See
[Releases](AGENTS.md#releases) for how a change gets to npm.
