# web — The documentation site

A TanStack Start + Fumadocs app. Marketing landing page at `/`, docs under `/docs`, and the native
library namespaced at `/docs/native/*` so a second library can be added later without a URL
migration.

Documents `@delacour/native-ui` and the `delacour` CLI that copies its components into a
consumer's repository. It does **not** import or render those components — see **Why there are no
live previews**.

## Stack

- **TanStack Start** (Vite 8, Nitro) — SSR, file routes, server functions
- **Fumadocs** — `fumadocs-core` + `fumadocs-ui` (aliased to `@fumadocs/base-ui`) + `fumadocs-mdx`
- **Tailwind CSS v4**, painted from `@delacour/native-ui`'s own token scale
- **ZBSearch** (Fumadocs' default) for `/api/search`

## Commands

```bash
bun run dev          # vite dev on :3000
bun run build        # → .output/server/index.mjs
bun run start        # bun .output/server/index.mjs
bun run check        # Biome lint + format
bun run typecheck    # tsc --noEmit
```

## Directory structure

```
content/docs/native/
├── meta.json              the /docs/native namespace
├── getting-started/       root folder → navbar tab
├── components/            root folder → navbar tab
├── cli/                   root folder → navbar tab
└── releases/              root folder → navbar tab

src/
├── components/mdx.tsx     the MDX component registry
├── lib/source.ts          defineDocs + loader, baseUrl "/docs"
├── lib/shared.ts          appName, docsRoute, gitConfig, markdown URL encode/decode
├── lib/layout.shared.tsx  baseOptions() — navbar title, links, GitHub URL
├── routes/
│   ├── __root.tsx         RootProvider + <html>
│   ├── index.tsx          the landing page
│   ├── docs/index.tsx     /docs → /docs/native/getting-started
│   ├── docs/$.tsx         the docs catch-all
│   ├── docs/{$}[.]md.ts   <page>.md — see "The .md routes 404 in dev"
│   ├── api/search.ts
│   └── llms[.]txt.ts, llms-full[.]txt.ts
├── start.ts               csrf + Accept: text/markdown negotiation
└── styles/app.css         Tailwind + Fumadocs preset + the native-ui palette
```

## The layout is `notebook`, not `docs`

`src/routes/docs/$.tsx` imports `DocsLayout` from **`fumadocs-ui/layouts/notebook`** and passes
`tabMode="navbar"`. That is the only layout with a `navbar` tab mode — it lifts the root-folder
tabs out of the sidebar and into the top bar, which is the shape this site wants.

The page slots must come from the **matching** package: `fumadocs-ui/layouts/notebook/page`, not
`.../layouts/docs/page`. Mixing them throws at render time with
*"Please use `<DocsPage />` under `<DocsLayout />`"*.

## Adding a page

1. Drop an `.mdx` file in the right folder under `content/docs/native/`.
2. Add its filename to that folder's `meta.json` `pages` array, at the right position. A page
   missing from `pages` still resolves by URL but does not appear in the sidebar.
3. Sidebar section headings are separators — `"---Section Name---"` entries in `pages`.
4. Frontmatter takes `title`, `description` and `icon` (any Lucide name — resolved by
   `lucideIconsPlugin()` in `src/lib/source.ts`).

### A CLI page

`content/docs/native/cli/` documents `packages/cli`, not the library. It is a root folder of the
**native** namespace rather than a `/docs/cli` namespace of its own, because the CLI is how this
library is delivered rather than a second library — and `src/lib/layout.shared.tsx` only links
into `native`, so a top-level namespace would render but be unreachable from the nav.

Command flags are transcribed from `delacour <command> --help`. When one changes, that output is
the source of truth; nothing checks the pages against it.

### A component page

Add it to `content/docs/native/components/`, list it under the right `---Group---` in that
folder's `meta.json`, **and** add a `<Card>` for it to `components/index.mdx`. The index is
hand-maintained; nothing generates it.

## MDX components must be registered

`defaultMdxComponents` carries only `Callout`, `Card` and `Cards`. Everything else —
`Tabs`/`Tab`, `TypeTable`, `Steps`/`Step`, `Accordion(s)`, `Files`/`File`/`Folder` — is registered
by hand in `src/components/mdx.tsx`. An MDX file naming an unregistered component fails the render
with *"Expected component X to be defined"* rather than degrading.

<!-- Do not reach for AutoTypeTable. -->
`fumadocs-typescript`'s `AutoTypeTable` is **React Server Components only** and cannot run on
TanStack Start. Prop tables are hand-written `<TypeTable>` blocks. Source them from the component's
own `index.ts` — prop types are colocated with their component (`ButtonProps` is in `button.tsx`),
not in `*.types.ts`, which holds only shapes shared by two or more modules in the folder.

## Styling: only `tokens.css` is web-safe

`packages/native-ui/src/styles/` splits three ways:

| File | Web-safe? |
| --- | --- |
| `tokens.css` | **Yes.** Pure Tailwind v4 `@theme` — radii, type steps, `--spacing-icon-*`. Imported. |
| `theme.css` | **No.** Its palette lives under `@variant light` / `dark` / `ios` / `android`; `light`, `ios` and `android` are Uniwind variants that do not exist outside React Native. |
| `base.css` / the `./styles` barrel | **No.** Pulls in `@import "uniwind"`. |

So `src/styles/app.css` imports `tokens.css` and then transcribes `theme.css`'s hex values onto
Fumadocs' `--color-fd-*` names by hand. **When the library's palette changes, update that block.**
Nothing checks it.

One deliberate divergence: the library's `card` and `background` are both `#ffffff` in light, so
`--color-fd-card` takes `tertiary` (`#f8f8f8`) instead — a docs card has to read as a surface.

## Gotchas

### The `.md` routes 404 in dev

`/docs/native/components/button.md` returns Nitro's *"Cannot GET"* under `bun run dev` and works
correctly under `bun run build && bun run start`. Vite's dev middleware claims any URL whose last
segment contains a dot before Start's router sees it — this affects every dotted path served by a
**dynamic** route. `/llms.txt` is unaffected because its route path is fully literal.

Do not "fix" this. It is not a code bug, and the same is true of the `Accept: text/markdown`
negotiation in `src/start.ts`, which redirects to a `.md` URL. Verify both against a production
build.

### Prerendering is off

`tanstackStart()` takes no `prerender` option here. With it on, the crawler times out against its
own server and emits 0 pages, failing the build. Railway runs a live process, so nothing needs it.
Turn it back on only alongside a static host, and expect to debug the crawler.

### Biome and router filenames

`__root.tsx`, `$.tsx`, `{$}[.]md.ts` and `llms[.]txt.ts` all violate the repo-wide
`style.useFilenamingConvention: "error"`. `biome.jsonc` turns that rule off for `src/routes/**`,
the same way `apps/playground` does for `src/app/**`. `src/routeTree.gen.ts` is generated,
gitignored, and excluded from Biome.

### `typecheck` depends on `codegen`, and must keep doing so

`tsc` cannot check this app until `src/routeTree.gen.ts` exists, and that file is written by the
TanStack Start Vite plugin during `buildStart` — so on a clean checkout it is absent and **every
route fails to typecheck**. `turbo.jsonc` therefore gives `@delacour/web#typecheck` an edge to
`@delacour/web#codegen`, which is `vite build`.

Do not remove that edge as redundant because the file happens to be on your disk: it is there
because you ran `dev` or `build` at some point, and CI never has. It costs about two seconds of
wall clock, since turbo runs it alongside the other packages' typechecks.

`@tanstack/router-generator`'s `Generator` is **not** a lighter substitute. It writes the route
tree but omits the `declare module "@tanstack/react-start"` block carrying `Register`, which is
what gives the routes their types — without it every `createFileRoute("/docs/$")` fails with
*Argument of type '"/docs/$"' is not assignable to parameter of type 'undefined'*.

### `react` and `react-dom` come from the catalog

Both are `"catalog:"` (19.2.3), pinned alongside React Native's copy. `bunfig.toml` sets
`linker = "hoisted"`, so a version that drifts from the catalog materialises a second React and
breaks hooks. Hydration warnings in the console are the first symptom.

## Known content gaps

- **Previews cover twelve of nineteen components.** The remaining seven — Icon, Input, Field, Tabs,
  Screen, BottomSheet and DelacourProvider — have no captured demos yet, so their cards on the
  components index show a placeholder. `apps/playground/src/demos/demos.test.ts` fails by name for
  a library component with no demo, so that list stays honest on its own.
- **Every component page now carries a hand-written `<TypeTable>`.** The "prop tables in progress"
  and "reference docs in progress" callouts are gone; do not reintroduce one without the gap it
  names being real, because a callout that over-reports what is missing is worse than none.
  Source props from the component's own file — `ButtonProps` is in `button.tsx`, not in
  `*.types.ts`, which holds only shapes shared by two or more modules. Where a shape *is* shared
  (`ScreenInsetProps`, `ScreenPlacementProps`, `ScreenScrollableProps`), document it once and let
  the part tables stay short.
- Component prose lives per component at `packages/native-ui/src/components/<name>/AGENTS.md`,
  indexed from the package's own `AGENTS.md`. `src/docs.test.ts` fails the build on a component
  missing either, so that index is a reliable place to start when writing a page here.
- `releases/index.mdx` is hand-maintained from `git log --oneline -- packages/native-ui`.

## Previews are captured media, not live components

`<Preview id="switch/colours" />` renders an image or a looping clip of the real
component, photographed on a simulator, beside the code that produced it. Both come from one
file — `apps/playground/src/demos/<component>/<demo>.tsx` — so the picture and the snippet cannot
disagree with each other or with the component.

| Thing | Where | Generated by |
| --- | --- | --- |
| `src/components/preview.tsx` | here | hand-written |
| `src/previews/manifest.ts` | here, **generated** | `bun run previews` |
| `public/previews/**` | here, **generated** | `bun run previews` |
| The demos | `apps/playground/src/demos/` | hand-written |
| The interactions | `.argent/flows/previews/` | recorded with argent |

Regenerate everything with **`bun run previews`** from the repo root. It drives a simulator, so it
needs a Mac with Xcode — it is not part of `bun run build` and never runs on Railway. The media is
committed for exactly that reason.

`<Preview>` must stay registered in `src/components/mdx.tsx`, like every other custom component.
`manifest.ts` is excluded from Biome in `biome.jsonc` the way `routeTree.gen.ts` is; without that
the pre-commit hook reformats it and the next capture writes it straight back.

**Why not render the components for real.** `@delacour/native-ui` ships raw `.tsx` whose
`className`s are compiled by Uniwind's **Metro** transform. Rendering one here would need
react-native-web plus `uniwind/vite` and `vite-plugin-rnw`, and Reanimated 4, Gesture Handler and
`react-native-keyboard-controller` are all unproven in that path. A photograph of the real component
on a real device is also a more honest illustration than a react-native-web reproduction of it.

If live previews are ever added anyway, do it as an **isolated** Vite app in an iframe rather than
by aliasing `react-native` inside this app — the alias is global and would apply to the whole docs
bundle.

### The theme swap is CSS, deliberately

Both themes are captured and both are in the DOM; `dark:hidden` / `hidden dark:block` picks one.
That works because `fumadocs-ui/css/lib/base.css` redefines the `dark` variant as
`&:where(.dark, .dark *)` and `RootProvider` drives `next-themes` with `attribute: "class"`. No
hook, no mounted guard, no hydration flash.

Videos start from an IntersectionObserver rather than `autoplay`, which is what makes
`preload="none"` mean anything: an autoplaying video is fetched even under `display: none`, so the
off-theme copy of every clip would download on load.

### Range requests

The Nitro static handler answers a range request with the whole file (`200`, no `Accept-Ranges`).
Clips are tens of kilobytes and carry `-movflags +faststart`, so this is invisible. It would matter
if a preview ever became a long video; none should.
