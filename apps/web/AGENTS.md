# web — The documentation site

A TanStack Start + Fumadocs app. Marketing landing page at `/`, docs under `/docs`, and the native
library namespaced at `/docs/native/*` so a second library can be added later without a URL
migration.

Documents `@delacour/native-ui`. It does **not** import or render its components — see
**Why there are no live previews**.

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

### `react` and `react-dom` come from the catalog

Both are `"catalog:"` (19.2.3), pinned alongside React Native's copy. `bunfig.toml` sets
`linker = "hoisted"`, so a version that drifts from the catalog materialises a second React and
breaks hooks. Hydration warnings in the console are the first symptom.

## Known content gaps

- Three component pages are written in full — **Button**, **Text**, **Field**. The other sixteen
  carry an accurate summary and a "reference docs in progress" callout, and still need worked
  examples and `<TypeTable>` prop tables.
- Component prose lives per component at `packages/native-ui/src/components/<name>/AGENTS.md`,
  indexed from the package's own `AGENTS.md`. `src/docs.test.ts` fails the build on a component
  missing either, so that index is a reliable place to start when writing a page here.
- `releases/index.mdx` is hand-maintained from `git log --oneline -- packages/native-ui`.

## Why there are no live previews

`@delacour/native-ui` ships raw `.tsx` whose `className`s are compiled by Uniwind's **Metro**
transform. Rendering a component on the web would need react-native-web plus `uniwind/vite` and
`vite-plugin-rnw`, and Reanimated 4, Gesture Handler and `react-native-keyboard-controller` are all
unproven in that path.

If it is ever added, do it as an **isolated** Vite app in an iframe rather than by aliasing
`react-native` inside this app — the alias is global and would apply to the whole docs bundle.
