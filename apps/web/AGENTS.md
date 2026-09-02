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
bun run icons        # regenerate the browser icon set from @delacour/brand
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
├── components/delacour-icon.tsx  the brand mark, inline
├── components/install.tsx <ComponentInstall> and <InstallTabs>
├── registry/install.ts    here, **generated** — see "The install block is derived"
├── lib/source.ts          defineDocs + loader, baseUrl "/docs"
├── lib/shared.ts          appName, docsRoute, gitConfig, markdown URL encode/decode
├── lib/layout.shared.tsx  baseOptions() — navbar title, links, GitHub URL
├── routes/
│   ├── __root.tsx         RootProvider + <html>
│   ├── index.tsx          the landing page
│   ├── docs/index.tsx     /docs → /docs/native/getting-started
│   ├── docs/$.tsx         the docs catch-all
│   ├── docs/{$}[.]md.ts   <page>.md — see "The .md routes 404 in dev"
│   ├── theme.tsx          /theme — a preset code, rendered as CSS
│   ├── api/search.ts
│   └── llms[.]txt.ts, llms-full[.]txt.ts
├── start.ts               csrf + Accept: text/markdown negotiation
└── styles/app.css         Tailwind + Fumadocs preset + the native-ui palette

scripts/generate-icons.ts  the browser icon set — see "Branding"
public/favicon.*           generated
public/icon-*.png          generated
public/apple-touch-icon.png generated
public/site.webmanifest    hand-written
```

## Branding

The mark comes from [`@delacour/brand`](../../packages/brand/AGENTS.md) — the same master art
`apps/playground` rasterises into launcher icons. Nothing here re-draws it from its own numbers.

| Surface | File | Treatment |
| --- | --- | --- |
| Tab icon | `public/favicon.svg`, `public/favicon.ico` | rounded |
| Install prompt | `public/icon-192.png`, `public/icon-512.png` | rounded, `purpose: "any"` |
| Android launcher | `public/icon-maskable-512.png` | full-bleed card, glyph inset to the safe zone |
| iOS home screen | `public/apple-touch-icon.png` | **full bleed, square corners** |
| Nav bar, hero | `src/components/delacour-icon.tsx` | rounded, inline SVG |

Regenerate the files with `bun run icons` and commit them. It uses `@resvg/resvg-js`, so unlike
`bun run previews` it needs no simulator and no system libraries — but `build` still does not run
it, so a change to the art that is not regenerated ships the old icons.

**Who rounds the corners is the whole design.** iOS and Android mask an icon themselves; rounding
`apple-touch-icon.png` or the maskable icon first ships one rounded twice, with pale corners
inside the system's own mask. A favicon is masked by nobody, so its radius has to be in the art.
`DELACOUR_CORNER_RATIO` in `packages/brand` is that radius, and `delacourIconSvg({ corner })` is
how both the generator and `delacour-icon.tsx` apply it.

`delacour-icon.tsx` draws the mark inline rather than pointing an `<img>` at `/favicon.svg`, so
the logo in the nav bar cannot disagree with the favicon: both resolve to the same constants, and
`packages/brand`'s test is what pins those to the art.

### Head tags

`src/routes/__root.tsx` carries the icon links, the manifest link, the `theme-color` pair and the
Open Graph / Twitter tags. Two things there are deliberate:

- **`theme-color` is the page's background, not the icon's card** — `#ffffff` and `#0a0a0a`, the
  two `--color-fd-background` values, behind a `prefers-color-scheme` media attribute. The
  manifest's own `theme_color` *is* the card, because an installed app's splash sits behind the
  icon rather than behind the page.
- **The social card is `summary`, not `summary_large_image`.** `og:image` is the 512px icon; there
  is no 1200×630 card to point at. Claiming the large format without one gets the icon stretched
  and cropped. A real card would want `satori` and a pinned font — `docsImageRoute` in
  `src/lib/shared.ts` is the placeholder that route would take.

`siteUrl` in `src/lib/shared.ts` makes the `og:` URLs absolute, which every scraper requires.
Staging serves production's origin in those tags; threading a per-environment origin through SSR
buys nothing for a docs site.

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

`commands.mdx` carries each command's `--help` **verbatim**, in a ```txt block under a bold
**Options** label, rather than a `<TypeTable>` restating it. The output is the source of truth and a
transcription of it is a second copy that drifts — which is what had already happened to `init`'s
`--package-name` and `--package-path`. Regenerate a block with
`bun --filter delacour run build && node packages/cli/dist/index.js <command> --help`, and replace
the printed `--cwd` default (an absolute path) with *the current directory*. Nothing checks this
automatically.

### A component page

Add it to `content/docs/native/components/`, list it under the right `---Group---` in that folder's
`meta.json`, and add an entry to `src/lib/components.ts` — that list drives the index grid and the
landing page's component strip, so `components/index.mdx` needs nothing (it is `<PreviewGrid />`).

Every component page follows one shape, and `src/content.test.ts` fails the build if it does not:

```mdx
<Preview id="<hero>" title={null} />                the hero, before the first heading

## Installation                                     must be the first `##`
<ComponentInstall name="<slug>" />                  must name this page's own slug

## Usage                                            must be the second `##`
the import fence, then the JSX fence, no prose between

## <Example>                                        flat sections, one sentence each
...
## API Reference                                    must be the last `##`
### <Part>  <TypeTable … />
```

The order is shadcn/ui's, and the value of it is entirely in it being the *same* order every time.
There is deliberately **no `## Examples` wrapper** — each example is a sibling `##`, which is what
keeps the right rail one flat list.

A component with no captured preview (`bottom-sheet`, `provider`) opens at `## Installation` rather
than carrying a placeholder.

Reasoning prose belongs in `packages/native-ui/src/components/<name>/AGENTS.md`, not here. A page
section is a heading, at most one sentence, and the example. A `<Callout>` survives only if it warns
a *reader* about a failure with no error message; a callout explaining a maintainer's reasoning does
not.

## The install block is derived

`<ComponentInstall name="button" />` renders three tabs — **Command**, **Package**, **Manual** — and
every fact in them is read from `src/registry/install.ts`, which
`scripts/gen-install-manifest.ts` derives from `registry/r/*.json`, which the registry builder
derives from `packages/native-ui/src`. Nothing is transcribed, so nothing can be wrong about which
packages a component needs or which files it is made of.

```bash
bun run gen-install     # after any change to registry/ or src/lib/components.ts
```

| Thing | Where | Generated by |
| --- | --- | --- |
| `src/components/install.tsx` | here | hand-written |
| `src/registry/install.ts` | here, **generated** | `bun run gen-install` |
| `registry/r/*.json` | repo root, **generated** | `bun --filter delacour run registry:build` |

CI rebuilds both and fails on a diff, in the same job. `install.ts` is excluded from Biome in
`biome.jsonc` the way `manifest.ts` and `routeTree.gen.ts` are.

Three things are load-bearing:

- **It is a generated module, not a JSON import.** `registry/` lives outside this app's Vite root,
  so importing it would need a `server.fs.allow` entry; and a literal type makes
  `<ComponentInstall name="buton" />` a compile error rather than a runtime 500 a reader finds.
- **The Manual tab's source path is the registry's own, unmapped.** An item names the library file
  it is — `packages/native-ui/src/components/button/button.tsx` — so linking at the real thing is a
  copy, not a translation. This used to reverse a flattened `files/ui/button/button.tsx` through
  five rules with one exception; there is nothing to reverse now. The generator still throws on a
  path that is not on disk, and `src/registry/install.test.ts` asserts every emitted path exists.
- **`InstallTabs` keeps `expo install` separate from `add`.** That is not a spelling variant:
  `bun add react-native-reanimated` fetches the newest release, which on an older SDK fails at the
  linker. Do not replace this with `fumadocs-docgen`'s ```package-install fence — it cannot express
  the difference. (That fence appeared once on the installation page and rendered as an
  unhighlighted block, because `fumadocs-docgen` is not installed. It is gone.)

## MDX components must be registered

`defaultMdxComponents` carries only `Callout`, `Card` and `Cards`. Everything else —
`Tabs`/`Tab`, `TypeTable`, `Steps`/`Step`, `Accordion(s)`, `Files`/`File`/`Folder` — is registered
by hand in `src/components/mdx.tsx`. An MDX file naming an unregistered component fails the render
with *"Expected component X to be defined"* rather than degrading.

That file also overrides `a`, for an unrelated reason — see [A link to `/llms.txt` has to be a
plain anchor](#a-link-to-llmstxt-has-to-be-a-plain-anchor).

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

So `src/styles/app.css` imports `tokens.css` and then transcribes `theme.css`'s palette onto
Fumadocs' `--color-fd-*` names by hand. **When the library's palette changes, update that block** —
`src/styles/app.css.test.ts` fails when the two disagree, comparing them token for token.

The transcription is verbatim `oklch()`, the notation the library authors. A browser reads it
natively, so there is nothing to convert and the comparison is string equality rather than a
colour-space round trip that could disagree about rounding. `--color-fd-background` matching
`--background` is the one that shows: `preview.tsx` composites a captured shot onto it, and the
simulator painted that shot with `--background`.

One deliberate divergence, and it is the reason the test's map omits `fd-card`: the library's `card`
and `background` are both white in light, so `--color-fd-card` takes `tertiary` instead — a docs
card has to read as a surface. `tertiary` is a `color-mix` of two variables `app.css` does not
import, so its value is resolved there rather than copied.

## `/theme` renders a preset

`src/routes/theme.tsx` takes a `?preset=` code from `apps/playground`'s Theme screen, decodes it
with `@delacour/design-system`, and renders the resulting `globals.css` in a `DynamicCodeBlock`
with a copy button. Three things about it are load-bearing:

- **It is the only route here that reads a search param**, and its `validateSearch` **never
  throws**. A throw becomes a `SearchParamError` and the router renders an error boundary — so a
  code that lost its last character to a chat client's link detection would show a stack trace
  instead of a theme. The validator only asks "is there a non-empty string called `preset`";
  whether it decodes is `src/lib/theme-preset.ts`'s business, and `resolvePreset` answers with a
  usable config in every branch, including the invalid one.
- **It renders on the server.** Decode, resolve and emit are pure and synchronous, so there is no
  loader and no server function, and the CSS is in the first paint — which is what makes the link
  worth pasting into a chat and what keeps the page useful with JavaScript off. If anyone ever
  moves that work into a `useEffect` the page will still *look* right; `curl … | grep oklch` is
  what catches it.
- **One file carries both modes**, `:root` and `.dark`, because that is shadcn's `globals.css`
  shape. So there is deliberately no light/dark tab over the code block — it would be a lie about
  what the file is. The specimens in the axis summary *do* follow the page's theme, and they do it
  with `dark:hidden` / `hidden dark:inline` for the same reason `preview.tsx` does.

The route is not in `baseOptions().links`: `/theme` with no preset is the library's own defaults,
which every visitor already has. It is linked from `getting-started/theming.mdx` instead, which is
the page about bringing a theme across.

**The dev server binds to all interfaces.** `server.host: true` in `vite.config.ts`, because the
playground's Generate CSS button opens this site at whatever host Metro reached the app on — a LAN
address on a device, and on a simulator too whenever Metro was started on the LAN. Vite's default is
`::1`, so every one of those links died at *"Safari can't open the page"* while `localhost:3000`
worked fine from the same machine. Metro is already on the LAN on 8088 for the same reason.

Nothing needed adding to `vite.config.ts` for the workspace dependency — `apps/web` already imports
raw `.ts` from `@delacour/brand` in an SSR'd component, and Vite transpiles a linked workspace
package rather than externalising it. Verified against `bun run build && bun run start`, not `dev`.

## Gotchas

### The `.md` routes 404 in dev

`/docs/native/components/button.md` returns Nitro's *"Cannot GET"* under `bun run dev` and works
correctly under `bun run build && bun run start`. Vite's dev middleware claims any URL whose last
segment contains a dot before Start's router sees it — this affects every dotted path served by a
**dynamic** route. `/llms.txt` is unaffected because its route path is fully literal.

Do not "fix" this. It is not a code bug, and the same is true of the `Accept: text/markdown`
negotiation in `src/start.ts`, which redirects to a `.md` URL. Verify both against a production
build.

### A link to `/llms.txt` has to be a plain anchor

`/llms.txt`, `/llms-full.txt` and the `.md` twins are route handlers with no component, and the
generator still writes their paths into `routeTree.gen.ts`. Fumadocs' MDX `a` hands every internal
href to the client router, which matches one of those paths, finds nothing to render and falls
through to `defaultNotFoundComponent` — the link shows the 404 page while the same URL typed into
the address bar serves correctly.

`src/components/mdx.tsx` therefore overrides `a` with an `Anchor` that emits a plain `<a>` whenever
`isFileHref` (`src/lib/shared.ts`) matches: an internal href whose last segment carries an
extension, which no docs URL does. Everything else keeps fumadocs' `Link` and its SPA navigation.
A new file route served only by a handler needs no further work; a link to one that *has* no
extension would.

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

- **Previews cover seventeen of nineteen components.** Only `bottom-sheet` and `provider` have no
  captured demos, so their cards on the components index show a placeholder and their pages open at
  `## Installation`. `apps/playground/src/demos/demos.test.ts` fails by name for
  a library component with no demo, so that list stays honest on its own.
- **Every component page now carries a hand-written `<TypeTable>`.** The "prop tables in progress"
  and "reference docs in progress" callouts are gone; do not reintroduce one without the gap it
  names being real, because a callout that over-reports what is missing is worse than none.
  Source props from the component's own file — `ButtonProps` is in `button.tsx`, not in
  `*.types.ts`, which holds only shapes shared by two or more modules. Where a shape *is* shared
  (`ScreenInsetProps`, `ScreenPlacementProps`, `ScreenScrollableProps`), document it once and let
  the part tables stay short.
- Component prose lives per component at `packages/native-ui/src/components/<name>/AGENTS.md`,
  indexed from the package's own `AGENTS.md`. `packages/native-ui/src/docs.test.ts` fails the build
  on a component missing either, so that index is a reliable place to start when writing a page
  here — and it is where prose trimmed from a page belongs.
- `releases/index.mdx` is hand-maintained from `git log --oneline -- packages/native-ui`.

## Previews are captured media, not live components

`<Preview id="switch/colours" />` renders an image or a looping clip of the real component,
photographed on a simulator from `apps/playground/src/demos/<component>/<demo>.tsx`. The picture is
all it renders. **Code beside an example is hand-written in the MDX**, at the call site a reader
would actually type — a demo file is a harness, and printing its source taught the reader to copy
the harness rather than the component.

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

### The media is capped, and never upscaled

`src/components/preview.tsx` carries `MEDIA` (`w-auto max-w-full object-contain`) plus a height cap
per frame — `STAGE_MEDIA` at `max-h-[420px]`, `DEVICE_MEDIA` at `max-h-[520px]`. Two separate
reasons, and neither is decoration:

- **`max-h`** keeps a hero out of the whole viewport. A `stage` capture can be portrait — `checkbox`
  is 616×720 — and unconstrained in the 900px content column that drew at ~1050px, with
  `## Installation` below the fold.
- **`w-auto`, no upscale** is about sharpness. `MAX_EDGE` in the capture script is 720px on the long
  edge, sized for roughly 2x its rendered width; the 900px column was stretching every stage capture
  past its own pixels. Raise `MAX_EDGE` before you raise either cap, not after.

**The two caps differ because the two frames hold different things.** A stage capture is one control;
a device capture is 332×720 of navbar, list and footer, and the stage cap draws that 194px wide, at
which point every row is an unreadable smudge.

It is a cap, not a fixed-height stage, so a short wide preview (`slider/anatomy`, 720×222) stays
short instead of floating in letterbox bands. `preview-grid.tsx` uses neither — an index card is a
uniform tile and wants its own `h-40 … object-contain`.

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
