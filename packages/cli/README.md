# delacour

React Native components for Expo apps. The CLI copies the source into your
repository — you own `button.tsx` and can edit it, rather than waiting for a
release.

```bash
bunx delacour@latest init
bunx delacour@latest add button
```

## Why not a component package

Installing `@some/ui-kit` means every change to a button is someone else's
release. This works the way shadcn/ui does instead: `add` writes real files into
your project, rewrites the imports to your own aliases, and gets out of the way.

Unlike shadcn, the target is Expo, which changes real things:

- Native modules install through **`expo install`**, so the SDK resolves a
  version it can build. `bun add react-native-reanimated` fetches the newest
  release, which on any older SDK does not compile.
- `init` wraps **Metro** with Uniwind's config, outermost, so `className`
  compiles.
- `init` writes **`@source`** globs pointing at where the components actually
  landed — by real path, because Tailwind's scanner does not follow the
  `node_modules` symlink a monorepo creates, and a missed glob strips every
  class from a release build without erroring.
- **`delacour doctor`** checks all of it, plus New Architecture, path aliases,
  `GestureHandlerRootView`, and duplicate copies of a native module.

## Commands

| | |
|---|---|
| `init [components...]` | Write `delacour.json`, wire up Metro and the CSS entry, add the theme |
| `add <components...>` | Copy components and everything they need |
| `list` / `search <q>` | Browse the registry |
| `view <name>` | One item: its files, what it pulls in, what it installs |
| `diff [name]` | What has changed upstream since you copied it |
| `doctor` | Check this app is wired up correctly |
| `info` | The resolved config and what was detected |

Every registry-reading command takes `--registry <url>` (a URL,
`github:owner/repo`, or a local path), `--ref <git-ref>`, `--offline`, and
`--cwd <path>`.

## Where components go

`delacour.json` lives wherever the components live, and the nearest one wins
walking up from `--cwd`. In a monorepo that means:

```bash
cd packages/ui && bunx delacour init    # shared package, several apps use it
cd apps/mobile && bunx delacour init    # straight into the app
```

Either way the CLI finds the Expo app and wires *its* Metro config and CSS
entry, because that is where Metro runs.

```jsonc
{
	"$schema": "https://raw.githubusercontent.com/delacournz/delacour-ui/main/registry/config.schema.json",
	"framework": "expo",
	"paths": {
		"ui": "src/components/ui",
		"lib": "src/lib",
		"hooks": "src/hooks",
		"styles": "src/styles",
		"icons": "src/lib/icons"
	},
	"aliases": { "ui": "@/components/ui", "lib": "@/lib" },
	"app": { "root": "../../apps/mobile", "css": "src/styles/global.css" }
}
```

`paths` is where files land; `aliases` is how they import each other. They are
separate because a project may have no path aliases at all — in which case the
CLI writes relative imports, which Metro resolves whether or not
`experiments.tsconfigPaths` is on. Aliases are **read** from `tsconfig.json` and
never written to it.

## After `init`

Three things need a human, because each is a decision inside a file you own:

```tsx
// app/_layout.tsx
import "@/styles/global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
	return <GestureHandlerRootView style={{ flex: 1 }}>{/* … */}</GestureHandlerRootView>;
}
```

```ts
// app.config.ts — only if you use path aliases
experiments: { tsconfigPaths: true }
```

And after any `add` that installed a native module, rebuild the dev client —
a JS reload alone will red-box.

`delacour doctor` checks every one of these.

## Working on this package

```bash
bun run registry:build   # rebuild registry/ from packages/native-ui
bun test                 # unit + end-to-end against the local registry
bun run build            # bundle dist/index.js
bun run build:check      # assert the bundle stayed small and executable
```

The registry is **derived** from `packages/native-ui/src` — one item per
component folder, dependencies read off the imports. There is no `registry.json`
to maintain, and the builder throws rather than guessing: an unclassified npm
import or a component folder without an `index.ts` fails the build.
