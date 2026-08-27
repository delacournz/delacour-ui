# Delacour UI — Monorepo

A Bun workspace holding `@delacour/native-ui`, a React Native component library,
and the Expo app that renders it. Nothing here ships to a user; the library is
the product.

## Workspaces

| Path | Package | What it is |
| --- | --- | --- |
| `packages/native-ui` | `@delacour/native-ui` | **The product.** A React Native component library. Ships raw `.tsx`, no build step |
| `apps/playground` | `@delacour/playground` | Expo app — the library's harness and gallery |
| `packages/biome-config` | `@delacour/biome-config` | Lint and format rules, for everything |
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
@legendapp/list  react 19.2.3  react-native 0.86.2  react-native-gesture-handler ~2.32.0
react-native-keyboard-controller  react-native-reanimated 4.5.1  react-native-safe-area-context ~5.7.0
react-native-screens ~4.26.0  react-native-svg 15.15.4  react-native-worklets 0.10.1
```

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
which is why `apps/playground`'s `metro.config.js` pins eight of them to the
workspace-root copy and its `tsconfig.json` pins `react-native` the same way.

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

## Hooks

`prek` installs on `postinstall`. Two stages, configured in
`.pre-commit-config.yaml`:

| Stage | Runs |
| --- | --- |
| pre-commit | `scripts/pre-commit-biome.ts` — Biome `check --write` on staged files, re-staging anything it fixed |
| pre-push | `bun run typecheck` across every workspace |

`typecheck` depends on `build` in `turbo.jsonc`, which is what makes the pre-push hook usable at
all: TanStack Router generates the gitignored `apps/web/src/routeTree.gen.ts` during `vite build`,
so on a fresh clone `tsc` used to fail with a wall of `Property '_splat' does not exist on type
'never'` before anything had been built.

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
`apps/playground/assets/icon*.png` (`bun run icons`),
`apps/playground/src/demos/registry.ts` (`bun run gen-demos`), and `native-ui`'s
`package.json` `exports` map (`bun run gen-exports`).
