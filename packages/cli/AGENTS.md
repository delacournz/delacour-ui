# cli — The `delacour` CLI

Copies `@delacour/native-ui`'s source into a consumer's Expo project, the way shadcn/ui does for
the web. Published to npm as **`delacour`**; the registry it reads is committed at the repository
root and served from `raw.githubusercontent.com`.

Human-facing docs are `README.md` here and `/docs/native/cli` on the site. This file is the part
an agent needs: what the pieces are, and which decisions are load-bearing.

## Commands

```bash
bun run registry:build   # rebuild /registry from packages/native-ui
bun run verify:expo      # scaffold a real Expo app, add everything, typecheck it
bun run build            # bundle dist/index.js with tsdown
bun run build:check      # assert the bundle stayed small and executable
bun run typecheck        # tsc --noEmit (src and scripts)
bun run check            # Biome
bun test                 # unit + end-to-end against the local registry
```

## Directory structure

```
src/
├── index.ts              commander wiring, and the one place a failure becomes a message
├── commands/             init, add, browse (list/search/view/info), diff, doctor, mcp
├── config/               native-components.json — schema.ts (zod), resolve.ts (nearest-wins walk)
├── project/              everything that reads or patches a consumer's project
│   ├── detect.ts         package manager, Expo SDK, workspace root, app root, tsconfig paths
│   ├── aliases.ts        tsconfig paths → an import prefix per namespace
│   ├── css.ts            the managed @source block, and reading it back for doctor
│   ├── metro.ts          wrapping the export with withUniwindConfig
│   ├── package-manager.ts  the expo install / pm add split
│   ├── jsonc.ts          tsconfig.json is JSONC and usually has comments
│   └── write-files.ts    plan every file before writing any of it
├── registry/             the registry, both halves
│   ├── classify.ts       a source path → which item, which namespace, which target
│   ├── canonicalise.ts   imports → @registry/* placeholders   (build time)
│   ├── scan-imports.ts   TypeScript's preProcessFile           (build time)
│   ├── build.ts, write.ts, cli.ts, config.ts                   (build time)
│   ├── transform.ts      @registry/* → the consumer's aliases  (add time)
│   ├── client.ts         fetch + ETag cache + zod validation   (add time)
│   ├── resolve.ts        the dependency closure
│   ├── source.ts, namespaces.ts, schema.ts
└── ui/                   output.ts (all printing), diff.ts (the line diff)

scripts/
├── verify-expo.ts        the integration script
├── verify/               harness (scaffold, run), checks (the assertions), render (bundle, boot)
└── check-bundle.ts       prepublish guard
```

## The five rules

1. **`src/index.ts` must never reach `scan-imports.ts`.** It imports the whole of `typescript` —
   about ten megabytes — to read type-only imports out of the library's source. That runs at
   *registry build* time, in this repository. If an entry-point module ever imports it, every
   `bunx delacour` pays for it. `scripts/check-bundle.ts` asserts the compiler is absent from the
   bundle, and `prepublishOnly` runs it.

2. **`Bun.Transpiler` cannot scan these imports.** It reports what survives transpilation, so a
   type-only import is simply absent. Every component's `index.ts` re-exports its prop types with
   `export type { … } from "./x.types"`, and a scanner that cannot see those lines drops files
   from the item and ships a component that does not compile. Use `scanImports`.

3. **`paths` and `aliases` are different things.** `paths` is where a file lands; `aliases` is what
   other files import it as. They coincide only when the project has path aliases, and Metro reads
   `tsconfig` paths only with `experiments.tsconfigPaths` on. A namespace with no alias gets a
   relative import computed from the disk layout, which always resolves. **Aliases are read from
   `tsconfig.json` and never written to it.**

4. **`registry/` is build output and is excluded from Biome.** The pre-commit hook runs
   `biome check --write` on staged JSON and re-stages it, which would reformat the registry the
   builder had just written — permanent drift, and a CI check that could never pass. The exclusion
   is in the root `biome.jsonc`.

5. **The builder throws rather than guesses.** A component with no `ITEM_META`, an npm import with
   no `PACKAGE_INSTALL` entry, a relative import resolving to nothing — each fails the build. The
   alternative for the second one is defaulting to the package manager, which is how a native
   module gets installed at a version the SDK cannot build. That failure surfaces at someone
   else's linker rather than here.

## Adding a component to the registry

Nothing to write by hand except metadata. See the **The registry** section of
`packages/native-ui/AGENTS.md`: add an `ITEM_META` entry, classify any new npm import in
`PACKAGE_INSTALL`, then `bun run registry:build` and commit `registry/`.

## Testing

`bun test` is unit tests plus an end-to-end pass over a fixture, all offline. It runs the real
builder against the real `packages/native-ui`, not a copy of the conventions — the point of
deriving the registry is that the two cannot diverge.

`bun run verify:expo` is the one that catches what a fixture cannot. A fixture has no
`node_modules`, so an import naming an uninstalled package looks exactly like one naming an
installed package. It scaffolds a real Expo app, installs Uniwind and Tailwind, runs `init` against
the stock Metro config so the *patch* path is exercised, adds every item, and typechecks.

| Level | Proves |
| --- | --- |
| `--no-install` | The right files land, with the right imports. Offline, seconds. |
| *(default)* | Every import resolves and every type lines up. |
| `--bundle` | Metro resolves every module and **Uniwind compiles every class**. |
| `--simulator` | The components render on a device. Needs a Mac with Xcode. |

The app is built at `.verify/app` — gitignored and outside the workspace globs. The default run
removes it afterwards, `node_modules` and all; `--keep` retains it and makes the next run take
seconds rather than two minutes, and `--fresh` discards what a previous `--keep` left.

<!-- Cleaning up means all of it. -->
An earlier version kept `node_modules` through cleanup, on the theory that it was only a cache.
That left half a gigabyte inside a directory emptied of everything else — worse than either
cleaning up or not, and invisible because the directory looked bare. Living inside the monorepo costs
one thing: `doctor`'s duplicate-native-module check warns, because the repository root holds the
same packages. Do not "fix" that by contorting `doctor` for the harness's benefit — the warning is
accurate for where the app sits, and the guard that matters reads only the app's own
`node_modules`.

`--bundle` is the level worth understanding: `tsc` says nothing about `className`, because Uniwind
compiles it in a Metro transform, and a class the scanner never saw is dropped with nothing logged.

<!-- `--all` is components, not everything. -->
`add --all` adds `registry:ui` items and their closure, matching shadcn's convention. Items nothing
depends on — the `expo` navigation theme and its two helpers — are reachable only by name, which is
why `verify:expo` names them explicitly rather than trusting `--all` to cover the registry.

## Gotchas

### Errors go to stderr, always

`--json` writes to stdout, and so does the MCP server's JSON-RPC stream. A log line on stdout
corrupts both. `ui/output.ts` routes every error to stderr and drops everything else under
`--silent`.

### `doctor` is split in two

`runChecks()` returns the results and prints nothing; `doctor()` prints them. The MCP server calls
the first — writing a report to stdout would corrupt the protocol.

### The registry ref is baked in at build time

`tsdown.config.ts` defines `__REGISTRY_REF__` from `DELACOUR_REGISTRY_REF`, and release CI passes
the tag it is publishing. A published version therefore always reads the registry it shipped
against; `--ref main` opts into what has landed since.

### Markdown is canonicalised too, but differently

Each component folder's `AGENTS.md` travels with its source, so an agent in the consumer's
repository gets the design rules next to the code. It cannot go through `canonicaliseFile`, which
parses its input as TypeScript — `canonicaliseMarkdown` does the prose rewrite alone, so the copied
doc cites the consumer's paths rather than a package they never installed.
