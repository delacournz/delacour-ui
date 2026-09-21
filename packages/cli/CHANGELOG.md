# delacour

## 0.1.0-alpha.4

### Minor Changes

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add` sets the project up itself

  `add` no longer fails on a project with no `native-components.json`. It runs `init` first — writing
  the config, wrapping Metro, pointing Tailwind at the components and copying the theme and the root
  provider in — and then adds what was asked for. That was previously a prompt, and only where there
  was a terminal to ask in, so `--yes`, CI and every MCP call hit `MissingConfigError` while a human
  sailed past. `--no-init` is the opt-out, and `-s, --src <dir>` forwards to `init` so a template that
  keeps its files at the project root still needs one command.

  `init` now returns the result of the `add` it ends on, so a caller that set a project up still
  learns what the components need from npm.

  New MCP tool `init_project`, for the layout an agent cannot infer — a shared package in a monorepo,
  or a source directory that is not `src`. `add_components` needs it no more often than a person
  needs `init`.

- [#51](https://github.com/delacournz/delacour-ui/pull/51) [`09ea8bf`](https://github.com/delacournz/delacour-ui/commit/09ea8bfa066e1749622aee2a26fd511bb6be3348) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `delacour skills` installs an agent skill

  An agent asked for "a button" writes plausible JSX — the right shape, and none of the parts that
  matter: the icon that inherits its size from the button's context, the spinner that _replaces_ the
  icon so the label does not shift, the `expo install` route for the native modules underneath.

  `bunx delacour@alpha skills` installs a skill into whichever assistants a project uses — Claude
  Code, Cursor, OpenCode or Codex, detected from the directories present, or named with `--agent`, in
  `--scope project` or `user`. The files are bundled into the binary, so a run works offline and
  installs the skill matching the version you are pinned to. The docs site serves the same bytes at
  `/skills/delacour-ui/SKILL.md`.

  The skill names no component on purpose. A catalogue on someone's disk is stale the day the next
  component ships, and silently so — it teaches `list`, `view`, `add` and `doctor` instead, and spends
  its own words on the failures that produce no error message.

### Patch Changes

- [#52](https://github.com/delacournz/delacour-ui/pull/52) [`9bf93d6`](https://github.com/delacournz/delacour-ui/commit/9bf93d67c6078e0ca512f8b265431753174c87b6) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Teach one verb, and hold the docs to the CLI

  The Quick start forks before the first command — a new app, an existing one, or hand it to an
  agent — and lands all three on one rendered Button. It scaffolds Expo's `with-router-uniwind`
  example and never names `init`: `add` does that setup itself, so a reader learns one verb.

  The landing page's hero says `add` too, the package path names Uniwind as a real setup step with
  links to its own guide, and a handful of claims that had gone stale are corrected — the registry
  holds no copy of the library's source, `/llms.txt` lives on `ui.delacour.co.nz`, and the releases
  page no longer reports a version that was never published.

  `docs-commands.test.ts` walks the commander program and holds every copyable `delacour …` in the
  repository to it — verb, long flags, positional arity, and whether a component named in an example
  is in the registry. It caught `add --src` before a reader did.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `doctor` stops failing correct Metro configs, and tells you a path you can paste

  - **`withUniwindConfig is not the outermost wrapper`, when it was.** The check required the export
    expression to _begin_ with `withUniwindConfig`, so it failed both
    `const c = withUniwindConfig(…); module.exports = c;` and the reassignment a Metro config uses
    when it applies several wrappers in turn — `config = withUniwindConfig(config, …)`. A wrapper
    genuinely applied after Uniwind still fails, which is the point of the check.
  - **`cssEntryFile does not point at the configured entry` restated the problem rather than the
    fix.** It now says which file Metro actually compiles and why that is the one that has to win.
  - **The CSS import it told you to add did not resolve.** It was `./` plus the file's basename,
    which is right only when the root layout sits in the same directory as the CSS. On the ordinary
    Expo Router layout it is `../styles/global.css`, and that is what both `doctor` and `init` now
    print — from one function.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Adopt the Tailwind entry an app already has, and print the root layout

  **One entry, never two.** `init` picked `<src>/styles/global.css` unless a wrapped Metro config
  named another, so an app that had installed Uniwind and written its own `global.css` — without
  wiring Metro to it yet — got a second entry. Tailwind then compiled the file holding the `@source`
  globs while the app imported the one without them: every component unstyled, nothing logged, and
  `doctor` reporting that nothing imports the entry. An entry already on disk is now adopted.

  **The root layout is printed whole.** Two of the three follow-ups are edits to one file, so `init`
  shows that file rather than describing it — and detects Expo Router, whose root layout is a
  different file with a different shape (`app/_layout.tsx` rendering a `<Slot />`, not `App.tsx`).
  The bullet and the snippet take their import paths from one function, so they cannot disagree.

- [#55](https://github.com/delacournz/delacour-ui/pull/55) [`1947da7`](https://github.com/delacournz/delacour-ui/commit/1947da72a7b9c53aed55c6865c6f7c8985b04cb5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refresh the lockfile and drop an obsolete patch

  `bun.lock` pinned `expo-modules-jsi@57.0.5` while a dependency already required `~57.1.0`, so
  `bun install --frozen-lockfile` failed the moment anything forced a re-resolve. The patch that
  pinning existed for — declaring `retainRuntimeScheduler` / `releaseRuntimeScheduler` for Swift
  bridging — ships in `57.1.0` itself, so it and its `patchedDependencies` entry are gone.

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Stop the last line suggesting a command that already ran

  `add` delegates to `init` whenever a project has no config, so a run that copied `button` in ended
  on _"Ready. `delacour add button` to get started."_ — the command the reader had just run. The outro
  now names what landed instead: _"Ready. `button` is yours to edit."_

  It no longer mentions `doctor` either. The follow-up block directly above it already ends on
  `delacour doctor`, and two consecutive lines pointing at the same command read as a glitch rather
  than as emphasis.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Work correctly on a project that already has Uniwind

  Three bugs, all found against Expo's `with-router-uniwind` example — a scaffold that arrives with
  Uniwind, Tailwind and Metro already wired.

  - **`init` wrote its `@source` block into a file Metro does not compile.** A wired Metro config
    names its own `cssEntryFile`, and `init` recorded `<src>/styles/global.css` regardless — so
    Tailwind scanned a file with no globs in it, every class the components use was dropped, and
    every component rendered unstyled with nothing logged. It now reads `cssEntryFile` and `dtsFile`
    off the wrapped config and records those.
  - **`doctor` failed the official template.** Its outermost-wrapper check required the export
    expression to begin with `withUniwindConfig`, and that template assigns the wrapped config to a
    variable before exporting it. The exported name is now followed to the last thing assigned to it
    above the export, a few hops deep.
  - **`init` asked for a CSS import that was already there.** The follow-up list is now built from
    what the project actually has, so neither the CSS import nor the provider is listed once it is
    mounted.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refuse to stack a second Tailwind transform

  Nothing noticed when a project already had **NativeWind**. It is Tailwind for React Native too: it
  compiles `className`, and it does that by wrapping Metro. Wrapping Metro again on top of it leaves
  classes resolving through whichever wrapper ran last and a build that fails naming neither library.

  `init` now warns before it touches `metro.config.js`, and `doctor` carries a `Styling` check that
  keeps saying so.

  It is deliberately not fixed automatically. Which of the two a project keeps is the owner's call,
  and uninstalling someone's styling library is not a thing a component CLI gets to do — so the
  message points at Uniwind's migration guide instead.

## 0.1.0-alpha.3

### Patch Changes

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

## 0.1.0-alpha.2

### Minor Changes

- [#35](https://github.com/delacournz/delacour-ui/pull/35) [`ac1c4fe`](https://github.com/delacournz/delacour-ui/commit/ac1c4fe3768868236b740fc2202d334ce0704166) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `init` copies the root provider in and `doctor` accepts `DelacourProvider` as the gesture root

  `delacour init` now adds the `provider` item alongside `styles`, so `DelacourProvider` is in the
  `ui` directory before anything is mounted, and its follow-up list names that import rather than a
  bare `GestureHandlerRootView`. `doctor`'s Gesture Handler check passes on either name, reads a
  blank template's root `App.tsx` as well as `app/` and `src/`, and no longer counts the copied
  `provider.tsx` itself as the app mounting it.

## 0.1.0-alpha.1

### Minor Changes

- [#25](https://github.com/delacournz/delacour-ui/pull/25) [`c0a7ca4`](https://github.com/delacournz/delacour-ui/commit/c0a7ca4dfb4e97e09c97b6335f19c657c7535616) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - One theme file, the same shape everywhere

  `theme.css` is now the one file in `styles/` that is yours, and its header says so. What
  `delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
  `delacour theme` writes are held to the same shape, declaration for declaration.

  **`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
  the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
  shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
  still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
  dark theme that never arrives.

  **The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
  `Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
  derived when a source omits them, and the light `--elevated` derivation follows the card, as the
  shipped file already did.

  **The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
  fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
  in a second tab for a web app sharing the theme.

### Patch Changes

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.
