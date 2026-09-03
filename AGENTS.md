# Delacour UI — Monorepo

A Bun workspace holding `delacour-react-native-ui`, a React Native component library,
and the Expo app that renders it. Nothing here ships to a user; the library is
the product.

## Workspaces

| Path | Package | What it is |
| --- | --- | --- |
| `packages/native-ui` | `delacour-react-native-ui` | **The product.** A React Native component library. Ships raw `.tsx`, no build step |
| `packages/charts` | `delacour-react-native-charts` | The headless charting engine `native-ui`'s `Chart` skins — Skia, no tokens, no `className` |
| `packages/design-system` | `@delacour/design-system` | The customizer's axes, the resolver, the preset codec and the CSS emitters |
| `packages/cli` | `delacour` | The CLI that copies the library's source into someone else's repo, and the builder for the `registry/` it reads |
| `apps/playground` | `@delacour/playground` | Expo app — the library's harness and gallery |
| `apps/web` | `@delacour/web` | The documentation site — TanStack Start + Fumadocs, deployed on Railway |
| `packages/biome-config` | `@delacour/biome-config` | Lint and format rules, for everything |
| `packages/brand` | `@delacour/brand` | The Delacour mark — master art plus the geometry every rendering reads |
| `packages/tsconfig` | `@delacour/tsconfig` | Shared TypeScript configs |
| `packages/types` | `@delacour/types` | Shared utility types — `Result` and its constructors |

Each has its own `AGENTS.md`. **Read the one for the package you are editing** —
`packages/native-ui/AGENTS.md` is the substantial one, and it indexes a further
file per component.

## Commands

Run from the repo root; turbo fans each out across every workspace.

```bash
bun install                # postinstall wires the prek hooks
bun run dev                # turbo dev — the playground, in practice
bun run typecheck          # tsc --noEmit everywhere
bun run check              # Biome lint + format
bun run lint               # lint only
bun run fmt                # format only
bun test                   # unit tests
bun run previews           # recapture component preview media from a simulator
bun run nuke               # delete every node_modules and reinstall from scratch
```

Two generators live in the apps rather than at the root, because each writes into its own
workspace. Both read `packages/brand` and both commit their output:

```bash
cd apps/playground && bun run icons   # launcher, adaptive and tinted app-icon PNGs
cd apps/web        && bun run icons   # favicons, PWA icons, apple-touch-icon
```

`previews` is the odd one out: it drives an iOS simulator, so it needs a Mac with Xcode and it is
deliberately **not** part of `build`. Its output — `apps/web/public/previews/**` and
`apps/web/src/previews/manifest.ts` — is committed, which is what lets the docs site deploy on a
machine with no simulator. See [apps/playground/AGENTS.md](apps/playground/AGENTS.md#capturing-preview-media).

Turbo caching is **off** for every task but `build` (`cache: false` in
`turbo.jsonc`), so a run always reflects the tree as it is now.

## Branches

Nothing lands on `main` by pushing to it. The repository ruleset in `.github/rulesets/main.json`
blocks force-pushes and deletion, requires linear history, and requires a pull request whose four
CI checks are green, whose review threads are resolved, and whose branch is up to date with `main`.
Squash is the only merge method.

Approvals are **not** required — a sole maintainer cannot approve their own pull request — so the
gate is CI plus resolved conversations. A worktree is therefore a feature branch: opening a pull
request is the only way in. Repository admins can bypass in an emergency, and the audit log records
it when they do.

Because the branch must be up to date, `gh pr merge --auto` waits on a stale branch rather than
rebasing it. Press **Update branch**, or rebase, to clear it.

GitHub does not apply the ruleset from that file; the file is the reproducible copy of what was
applied. To change protection, edit the JSON, apply it, and commit both in the same change:

```bash
REPO=delacournz/delacour-ui
ID=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="main-protected") | .id')
gh api --method PUT "repos/$REPO/rulesets/$ID" --input .github/rulesets/main.json
```

## CI

`.github/workflows/ci.yml` runs four jobs in parallel on every pull request and on every push to
`main` and `develop` — `typecheck`, `check (lint + format)`, `test`, `build` — in about a minute.

All four are required status checks on `main`, which makes the job `name:` values an API contract:
they appear verbatim in `.github/rulesets/main.json` and GitHub matches them by string. Rename a job
without updating that file and every pull request blocks forever on a check that never reports.

For the same reason the workflow carries no `paths:` filter and no draft skip. A check that is
skipped is not a check that passed — it is a pull request that can never be merged.

Socket Security posts two further checks. They stay advisory on purpose: requiring a third-party app
would couple the merge gate to a vendor's uptime.

## Dependency versions

Shared native and React versions are pinned once, in the root `package.json`
`workspaces.catalog`, and referenced as `catalog:` from each package:

```
@legendapp/list  @shopify/react-native-skia 2.6.2  react 19.2.3  react-native 0.86.2
react-native-gesture-handler ~2.32.0  react-native-keyboard-controller  react-native-reanimated 4.5.1
react-native-safe-area-context ~5.7.0  react-native-screens ~4.26.0  react-native-svg 15.15.4
react-native-worklets 0.10.1
```

Every version here is the one Expo SDK 57 bundles. That is the rule, not a coincidence: `expo
install` and `expo-doctor` both check against it, and a native module a minor ahead of the SDK
fails at the linker rather than at install.

**Bump a version in the catalog, never in a package.** Two versions of a native
module register twice and break at runtime — which is also why `native-ui`
declares every native module as a **peer** dependency rather than a dependency.

## `linker = "hoisted"` is load-bearing

`bunfig.toml` sets it, and Metro is the reason:

> Metro resolves modules by walking `node_modules` directories and cannot see
> through Bun's default isolated layout (packages hidden under
> `node_modules/.bun`). A hoisted, flat `node_modules` is what React Native
> tooling expects; without this, Metro fails to resolve `@expo/metro-runtime`
> and the bundle never builds.

Do not remove it, and do not switch a package to an isolated install. Even
hoisted, Bun materialises a second copy of some native modules under the app,
which is why `apps/playground`'s `metro.config.js` pins nine of them to the
workspace-root copy and its `tsconfig.json` pins `react-native` the same way.

## `trustedDependencies`

`@shopify/react-native-skia` is the one package whose lifecycle scripts Bun is allowed to run. Its
`postinstall` copies the prebuilt `.xcframework`s out of `react-native-skia-apple-ios` into its own
`libs/`; blocked, the iOS build fails at link time with no framework to find. Bun blocks postinstall
scripts by default, so the package is named in `trustedDependencies` in the root `package.json`.

## Releases

Three packages reach npm — `delacour` (the CLI), `delacour-react-native-ui` and `delacour-react-native-charts`.
Everything else in the workspace is `private: true`, which is the only thing stopping
`changeset publish` from putting `@delacour/tsconfig` and friends on the registry the first time
it runs.

**Published names are unscoped; workspace-private names are not.** The `@delacour` scope on npm is
not ours, so the three packages that publish carry a `delacour-` prefix instead. Everything that
stays in the workspace keeps `@delacour/…` — a private package is never resolved from the registry,
so the scope costs nothing there and reads better in an import. Move a package from private to
published and it has to be renamed on the way out.

`delacour-react-native-charts` is public because it has to be: `native-ui` ships raw `.tsx`, so the
`import … from "delacour-react-native-charts"` in `chart.tsx` is in the published tarball and gets resolved by
a stranger's Metro. It is an **optional peer** of `native-ui` rather than a dependency — a
dependency may be nested, two copies mean two chart contexts, and a correctly-nested
`<Chart.Line>` then throws "must be used inside a `<Chart>`" from inside a `<Chart>`.

Releases are driven by [Changesets](https://github.com/changesets/changesets). A change that
should ship adds one:

```bash
bun run changeset          # pick packages, pick a bump, describe it
```

Commit that markdown file alongside the change. On merge to `main`,
`.github/workflows/release.yml` reads `.changeset/` and does one of two things:

| `.changeset/` holds | What happens |
| --- | --- |
| pending changesets | Opens or refreshes the **🔖 chore(release): version packages** PR — bumps versions, writes `CHANGELOG.md`, regenerates `bun.lock` |
| nothing | The version PR has just merged, so publish to npm and cut a GitHub Release per package |

So a release is two merges, and the versions are reviewable in between.

### Both packages are in alpha

`.changeset/pre.json` puts the repository in Changesets **pre mode**, tagged `alpha`. Both packages
sit at `0.0.1-alpha.0`, and while pre mode is on every `changeset version` produces the next
`-alpha.N` rather than a stable version.

Publishes go to npm's **`alpha` dist-tag**, from two directions: Changesets passes the pre tag, and
`publishConfig.tag` in each package pins it so a hand-run `npm publish` cannot claim `latest`
either. `latest` therefore points at nothing on purpose — an untested build should not be what
`bun add delacour-react-native-ui` resolves to. Every documented command names the tag
(`bunx delacour@alpha`, `bun add delacour-react-native-ui@alpha`).

Going stable is four steps, and skipping any one of them ships an alpha as `latest`:

```bash
bunx changeset pre exit          # deletes .changeset/pre.json
bun run changeset                # the changeset that names the stable version
```

then remove `"tag": "alpha"` from `publishConfig` in **all three** of
`packages/cli/package.json`, `packages/native-ui/package.json` and
`packages/charts/package.json`; delete the `DIST_TAG` map in
`packages/cli/src/project/package-manager.ts`, which exists only because `latest` points at
nothing during pre mode; and swap `@alpha` back to `@latest` across the READMEs and `apps/web`
— `grep -rn "@alpha"` finds them.

**npm auth is OIDC — there is no npm token.** All three packages are configured on npmjs.com with
this repository and `release.yml` as a trusted publisher, which is why the job requests
`id-token: write` and installs a current npm before publishing. `bun publish` cannot do this:
it has no OIDC or provenance support, so the publish call is npm's even though install and build
are Bun's. Changesets picks npm on its own — it only special-cases pnpm and yarn, and `bun` falls
through to the npm path.

**`RELEASE_TOKEN` is a GitHub PAT, not an npm one.** Events raised by `GITHUB_TOKEN` do not start
workflow runs, so a version PR opened with it would never run the four checks `main-protected`
requires and could never be merged. The PAT exists for that reason alone.

The first publish of each package had to be manual: npm can only bind a trusted publisher to a
package that already exists. That applies to any package added later — publish it by hand once,
bind the publisher, and CI takes over. `verify:expo` does not wait for that: it packs each
workspace package a registry item depends on (`delacour-react-native-charts`, for `chart`) and adds the
tarball to the scaffolded app before `add`, so the check covers this branch's engine rather than
whatever npm last served — and passes before the package exists there at all.

The registry the published CLI reads is pinned to the **commit** being released, not the tag —
`changesets/action` builds before it tags, so a tag-derived ref would name something that does not
exist yet. See `packages/cli/AGENTS.md`.

## Deployment

`apps/web` is deployed on Railway. The configuration lives in Railway, not in this repo — there
is no `railway.json`, `railpack.json` or Dockerfile here, and adding one would override the
service settings.

| Branch | Environment | Host |
| --- | --- | --- |
| `develop` | staging | `ui.staging.delacour.co.nz` |
| `main` | production | `ui.delacour.co.nz` |

`bun run previews` must never run in CI or in a deploy — it drives an iOS simulator and needs a Mac
with Xcode. Its outputs are committed so the site builds on a simulator-less runner.

`apps/web` also serves the deep-link association files — `/.well-known/apple-app-site-association`
and `/.well-known/assetlinks.json` — for both hosts. iOS reads its copy when the app is installed
and caches it, so **the docs deploy has to land before a playground build is installed**, or that
binary intercepts nothing until it is reinstalled.

`apps/playground` ships through EAS instead, from `apps/playground/.eas/workflows` — dev clients on
demand, and a push to `release/playground/x.y.z` running `release:prod`, which takes its version
from the branch name, ships an OTA update when the fingerprint already has a binary, and only
builds and submits when it does not. It is a separate
pipeline from the docs site and shares nothing with it; the details, including why none of those
workflows set a `working_directory`, are in
[apps/playground/AGENTS.md](apps/playground/AGENTS.md#eas).

## Hooks

`prek` installs on `postinstall`. Two stages, configured in
`.pre-commit-config.yaml`:

| Stage | Runs |
| --- | --- |
| pre-commit | `scripts/pre-commit-biome.ts` — Biome `check --write` on staged files, re-staging anything it fixed |
| pre-push | `bun run typecheck` across every workspace |

`@delacour/web#typecheck` depends on `@delacour/web#codegen` in `turbo.jsonc`, which is what
makes the pre-push hook usable at all: TanStack Router generates the gitignored
`apps/web/src/routeTree.gen.ts` during `vite build`, so on a fresh clone `tsc` used to fail with a
wall of `Property '_splat' does not exist on type 'never'` before anything had been built. The edge
is scoped to `apps/web` on purpose — no other workspace needs a build to typecheck.

A commit can therefore rewrite its own staged files. If a commit fails, the fix
is usually already applied and staged — re-read the diff before changing
anything.

## Patches

`patches/expo-modules-jsi@57.0.5.patch`, applied through
`patchedDependencies`. Changing the Expo SDK means checking whether it still
applies.

## Conventions

**TypeScript.** No `any` — type everything. Discriminated unions for type-based
shapes; `@delacour/types`' `Result` is the house example.

**Tests.** Write them first. Colocate as `{name}.test.ts` beside the source. Run
`bun test <path>` after each change and the related suites before committing.
`native-ui` can only test pure logic — React Native ships Flow-typed source Bun's
transpiler cannot parse — so behaviour that needs a renderer is verified in the
playground on a simulator instead.

**Files.** Kebab-case, enforced by Biome. The exception is `apps/playground/src/app`,
where Expo Router derives route names from filenames.

**JSX.** No comments inside markup — no `{/* … */}` in a render tree. The
explanation goes in the component's doc comment or above the `return`.

**Commits.** Gitmoji prefix, conventional type, package scope:

```
✨ feat(native-ui): add Tabs with a swipeable pager and a measured indicator
🐛 fix(native-ui): fade a Tabs separator only while the pager crosses it
🎨 style(native-ui): adjust Switch content text sizes
```

`✨ feat` · `🐛 fix` · `🔧 chore` · `📝 docs` · `🎨 style` · `♻️ refactor` ·
`✅ test` · `🚧 wip` · `👽️ types`. Commit messages end at their last real line —
no trailers. Nothing lands on `main` by pushing to it — see [Branches](#branches).

**Documentation is part of the change.** `native-ui`'s docs are updated in the
same commit as the code, and `bun test` fails by name for a component folder with
no `AGENTS.md`. That test exists because `Radio` shipped undocumented and nothing
caught it for fifteen commits.

## Generated, do not edit

`apps/*/ios`, `apps/*/android` (`expo prebuild`), `.expo`, `.turbo`,
`apps/playground/src/uniwind-types.d.ts` (Uniwind's Metro plugin),
`apps/playground/assets/{icon*,splash-icon}.png` and `apps/web/public/{favicon*,icon-*,apple-touch-icon}.*`
(`bun run icons`, in each app — the source is `packages/brand`),
`apps/playground/src/demos/registry.ts` (`bun run gen-demos`), and `native-ui`'s
`package.json` `exports` map (`bun run gen-exports`).
