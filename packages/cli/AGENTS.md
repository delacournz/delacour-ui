# cli — The `delacour` CLI

Copies `delacour-react-native-ui`'s source into a consumer's Expo project, the way shadcn/ui does for
the web. Published to npm as **`delacour`**; the registry it reads is committed at the repository
root and served from `raw.githubusercontent.com`, and what it serves is the library's own source
rather than a copy of it.

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
├── commands/             init, add, browse (list/search/view/info), diff, doctor, theme, mcp
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
│   ├── rewrite.ts        the specifier list an item ships, and applying it
│   ├── transform.ts      @registry/* → the consumer's aliases  (add time)
│   ├── client.ts         fetch + ETag cache + zod validation   (add time)
│   │                     also holds the file-fetch concurrency cap
│   ├── resolve.ts        the dependency closure
│   ├── source.ts, namespaces.ts, schema.ts
├── theme/                convert.ts — a web app's theme in, a `theme.css` out
└── ui/                   output.ts (all printing), diff.ts (the line diff)

scripts/
├── verify-expo.ts        the integration script
├── verify/               harness (scaffold, run), checks (the assertions), render (bundle, boot)
└── check-bundle.ts       prepublish guard
```

## The seven rules

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
   `biome check --write` on staged files and re-stages them, which would reformat the registry the
   builder had just written — permanent drift, and a CI check that could never pass. The exclusion
   is in the root `biome.jsonc`. It is JSON and nothing else: no `.tsx` lives under `registry/`, so
   the library's source is linted and formatted exactly once, where it is written.

5. **The builder throws rather than guesses.** A component with no `ITEM_META`, an npm import with
   no `PACKAGE_INSTALL` entry, a relative import resolving to nothing — each fails the build. The
   alternative for the second one is defaulting to the package manager, which is how a native
   module gets installed at a version the SDK cannot build. That failure surfaces at someone
   else's linker rather than here.

6. **An item references the library's own source; it does not carry a copy.** `r/button.json`
   names `packages/native-ui/src/components/button/button.tsx`, and the client fetches it — from
   the same ref the item came from, so the two can never disagree. shadcn inlines `content`
   instead, which is why their registry diffs are unreadable; copying the source into
   `registry/files/**`, which this used to do, was readable but duplicated the library two hundred
   files at a time. `registryFileSchema` *rejects* an inlined `content` rather than ignoring it, so
   a shadcn-shaped item fails with a message instead of 404ing halfway through a copy. `LoadedItem`
   is the hydrated shape — `client.loadItem()` produces it, and `planFiles` takes nothing else.

7. **What a copy used to carry, `rewrites` carries.** The library imports its neighbours by
   relative path and the consumer picks their own layout, so each file entry lists the specifiers
   to swap — `{ "from": "../icon", "to": "@registry/ui/icon" }` — and `client.loadItem()` applies
   them before `transform.ts` resolves the placeholder to the consumer's alias. The builder
   computes the list *and asserts that applying it reproduces, byte for byte, the file it
   canonicalised*; a specifier quoted somewhere other than an import fails the build rather than
   reaching a stranger's repository. `rewrites[].to` must parse as a placeholder, so the one field
   that edits a fetched file cannot be used to splice arbitrary source into someone's project.

## Adding a component to the registry

Nothing to write by hand except metadata. See the **The registry** section of
`packages/native-ui/AGENTS.md`: add an `ITEM_META` entry, classify any new npm import in
`PACKAGE_INSTALL`, then `bun run registry:build` and commit `registry/`. The rebuild touches item
JSON only — the component's `.tsx` appears in the diff once, where you wrote it.

## Testing

`bun test` is unit tests plus an end-to-end pass over a fixture, all offline. It runs the real
builder against the real `packages/native-ui`, not a copy of the conventions — the point of
deriving the registry is that the two cannot diverge.

`bun run verify:expo` is the one that catches what a fixture cannot. A fixture has no
`node_modules`, so an import naming an uninstalled package looks exactly like one naming an
installed package. It scaffolds a real Expo app, installs Uniwind and Tailwind, runs `init` against
the stock Metro config so the *patch* path is exercised, adds every item, and typechecks.

One thing it does not take from npm: a workspace package a registry item depends on.
`chart` installs `delacour-react-native-charts`, and `scripts/verify/harness.ts` packs that package with
`bun pm pack` and adds the tarball to the project between `init` and `add`, so `add` sees the
dependency declared and installs nothing for it. A tarball rather than a link, deliberately: the
pack is what a consumer receives — `files`, `exports`, no dev dependencies — so a type package
missing from `dependencies` fails this run instead of a reader's `tsc`. Add a package to
`WORKSPACE_PACKAGES` there when a new item takes a dependency on one.

The monorepo layout adds one rule to `mergePackageJson`: a package the shared manifest already
depends on is not recorded as a peer as well. bun resolves a peer against the registry even when
a dependency on the same name satisfies it, so a peer on an unpublished or tarball-installed
package fails every later install in the workspace — inside `expo install`, which never named it.
A peer on a package still in pre mode is written as `>=0.0.0-0` rather than `*`, since `*` admits
no prerelease; `peerRange` derives that from `DIST_TAG` and goes away with it.

| Level | Proves |
| --- | --- |
| `--no-install` | The right files land, with the right imports. Offline, seconds. |
| *(default)* | Every import resolves and every type lines up. |
| `--bundle` | Metro resolves every module and **Uniwind compiles every class**. |
| `--simulator` | The components render on a device. Needs a Mac with Xcode. |

`--layout monorepo` runs the whole thing again with the components in a shared package the app
imports by name. That layout has wiring the standalone one does not — a workspace link, an
`exports` map, Metro's resolver — and none of it is exercised by the first, which is how the
shared-package path shipped broken.

<!-- Two traps the monorepo layout exists to catch. -->
Both were found by building it, and both are silent:

- **`uniwind-env.d.ts` must be loadable by the app.** It is one triple-slash reference, so it only
  works from inside the app's own `tsconfig` include — a copy beside the components in a package
  never joins the app's program, and every `className` becomes a type error naming neither cause.
  `init` writes a second copy into the app; `doctor` fails without it.
- **A Bun workspace needs `linker = "hoisted"`.** The default isolated layout puts packages under
  `node_modules/.bun/…`, so the package and the app resolve React Native at different realpaths and
  `ComponentRef<typeof Animated.View>` collapses to `never`. The harness writes a `bunfig.toml`;
  the repository root carries the same file for the same reason.

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

### `--install` and `--no-install` are both declared, on purpose

Commander only applies a default to a `--no-` option declared **alone**. Declaring the pair leaves
the value `undefined` when neither is passed, and that third state is the whole design: unset means
ask when there is a TTY, and install nothing when there is not. Delete `--install` and the default
silently becomes `true` again — every script, CI job and MCP call starts running the user's package
manager unprompted. `src/index.ts` declares `--install` first for the same reason.

`add` therefore always prints what the components need and only sometimes installs it. The report
is `reportDependencies`, built from `planDependencies` in `project/package-manager.ts`, which is
pure and tested; the decision is `shouldInstall`, which is three lines and no cleverness.

### `add` returns its result because `mcp` prints nothing

The MCP server runs `add` under `--silent` — its stdout is a JSON-RPC stream, so a log line would
corrupt the protocol. Without a return value the agent copies a component and never learns it needs
a package the project has not got. `AddResult` carries the plan, and `mcp` renders it into the tool
reply. `null` is a run that copied nothing.

### Errors go to stderr, always

`--json` writes to stdout, and so does the MCP server's JSON-RPC stream. A log line on stdout
corrupts both. `ui/output.ts` routes every error to stderr and drops everything else under
`--silent`.

### `doctor` is split in two

`runChecks()` returns the results and prints nothing; `doctor()` prints them. The MCP server calls
the first — writing a report to stdout would corrupt the protocol.

### `theme` exists because Uniwind cannot read a `.dark {}` block

The palette `native-ui` paints from is shadcn's, name for name, so almost everything in a web app's
`globals.css` carries across untouched. The wrapper does not: Uniwind reads a theme only from
`@variant light` / `@variant dark`, and a literal `.dark { … }` is registered as a **utility class
named `dark`** that contributes nothing — no error, no warning, and a dark theme that never arrives.
That single fact is the whole reason the command exists.

`theme/convert.ts` is pure — CSS text in, CSS text out — and `commands/theme.ts` is only the I/O
around it, the same split `registry/canonicalise.ts` has from its command. The conversions worth
knowing about are in that file's own doc comment; two of them are load-bearing and easy to undo:
a font stack is cut to its first family (React Native takes one name, never a list), and a source's
derived `--radius-*` steps are dropped, because every corner here is a multiple of one `--radius`.

### The registry ref is baked in at build time

`tsdown.config.ts` defines `__REGISTRY_REF__` from `DELACOUR_REGISTRY_REF`, and release CI passes
**the commit it is publishing** — `github.sha`, not the tag. A published version therefore always
reads the registry it shipped against; `--ref main` opts into what has landed since.

A commit rather than a tag because `changesets/action` builds before it tags: a tag-derived ref
would name something that does not exist yet, and a publish that succeeded before a failed tag
push would ship a CLI pointing at a ref that never appears. `raw.githubusercontent.com` serves a
full SHA just as happily.

`DELACOUR_REGISTRY_REF` is set at **job** level in `release.yml`, not on the build step. `npm
publish` re-runs `prepublishOnly`, which rebuilds the bundle — if the ref were unset for that
rebuild it would silently bake `main` over the correct value.

### The CLI version is baked in too

`__CLI_VERSION__` comes from `package.json` through the same `define` block. It used to read
`process.env.npm_package_version`, which only exists under a package manager running a script —
`bunx delacour` is not that, so every published build reported the hardcoded fallback.

### Markdown is canonicalised too, but differently

Each component folder's `AGENTS.md` travels with its source, so an agent in the consumer's
repository gets the design rules next to the code. It cannot go through `canonicaliseFile`, which
parses its input as TypeScript — `canonicaliseMarkdown` does the prose rewrite alone, so the copied
doc cites the consumer's paths rather than a package they never installed.

Its rewrites are the reason `applyRewrites` has two modes. A package subpath is cited in prose as
often as it is imported, so it is replaced everywhere; a relative specifier is anchored on its
surrounding quote, because `../icon` is a prefix of `../icon-set`.
