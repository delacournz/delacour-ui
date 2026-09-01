# @delacour/design-system — The Axes, the Resolver and the CSS

The data behind `apps/playground`'s `/theme` customizer, plus everything that
turns a choice into text: a resolver, a preset codec and the CSS emitters.

It exists because two apps need the same answer. The playground composes a theme
on a device; `apps/web` renders that theme's CSS at `/theme` from a code in the
URL. While the axes lived under `apps/playground/src/`, only one of them could.

## What is in here

| Module | Import | What it is |
| --- | --- | --- |
| `base-colors.ts` | `@delacour/design-system/base-colors` | `BASE_COLORS` — 7 neutral ramps, light and dark, transcribed from shadcn |
| `themes.ts` | `…/themes` | `ACCENT_THEMES` — 17 accents, ~9 tokens each |
| `styles.ts` | `…/styles` | `STYLES` — 8 geometry bundles, Vega … Rhea |
| `radii.ts` | `…/radii` | `RADII` — five corners, `default` deferring to the style |
| `fonts.ts` | `…/fonts` | `FONTS` — 26 families, each carrying its TTF-embedded name |
| `config.ts` | `…/config` | `DesignSystemConfig`, `DEFAULT_CONFIG`, `normalizeConfig` |
| `resolve.ts` | `…/resolve` | `resolveTokens` — the composition, and the whole algorithm |
| `preset.ts` | `…/preset` | `encodePreset` / `decodePreset` — a config as a short shareable code |
| `emit.ts` | `…/emit` | `resolveTokens`' output as CSS someone can paste |
| `convert.ts` | `…/convert` | a web `globals.css` into this library's `theme.css` — what `delacour theme` runs |

No `"."` barrel, deliberately. `apps/playground/app.config.ts` reads only
`FONTS`, and Expo loads that file through Node's CJS resolver — a barrel would
make every `expo prebuild`, `expo start` and `expo config` transpile and evaluate
all nineteen hundred lines of oklch data to get at one array.

## Nothing in here imports React Native

That is the rule the whole package is built to keep, and it is not stylistic.
React Native ships Flow-typed source Bun's transpiler cannot parse, so a single
`react-native` import anywhere in this graph would take the entire resolve matrix
out of `bun test` — and that matrix is the only thing standing between a renamed
token and a customizer that writes a name no component reads.

`design-system.test.ts` is what it buys: it reads
`packages/native-ui/src/styles/theme.css` **as source text** and asserts every
name any axis writes is one the library actually declares. It reads the CSS by
relative path rather than depending on `@delacour/native-ui` — the move
`apps/web`'s `tokens-page.test.ts` and `app.css.test.ts` already make, and what
keeps the dependency arrow pointing one way.

The React Native half stays in the app:
`apps/playground/src/design-system/store.ts` is MMKV plus
`Uniwind.updateCSSVariables`, and it is the only file left there.

## Geometry is numbers here and units in the CSS

`STYLES` carries `radius: 10`, not `"10px"`. Uniwind's `createVarGetter` parses
colours with culori and passes everything else through unchanged, so a length
reaches React Native as a string and `height`, `borderRadius` and `fontSize`
ignore it with no error at all. Values in `tokens.css` escape this because the
bundler converts their units at build time; a runtime override does not.

So the numbers are the canonical form and `emit.ts` adds the units on the way
out: `--radius` in `rem` (÷ 16, so Vega's `10` is the `0.625rem` `tokens.css`
already ships), every other geometry token in `px`.

## A preset code is a promise

`encodePreset` produces a short opaque string that ends up in a URL someone
bookmarks, pastes into a chat, or reads off a phone. **A code must never come to
mean a different theme.**

That is why the wire format is built on **declared ordinals** — an explicit
`name → number` table per axis in `preset.ts` — and never on array position.
`STYLES` and `ACCENT_THEMES` are in shadcn's own editorial order, and reordering
them is a plausible change; if a code's meaning rode on that order, every link
ever shared would silently repoint.

The rules that follow, each enforced by `preset.test.ts`:

- **Ordinals are append-only.** Never renumber, never reuse a retired number.
- **A format change bumps the version byte**, and the golden-code table in the
  test is replaced rather than re-baselined. A failure there means every shared
  preset has been invalidated, which is a decision, not a rebase.
- **A trailing checksum byte** means a truncated or mistyped code is rejected
  rather than silently decoding to some other theme.
- **Decoding falls back per axis.** An ordinal this build does not know costs
  that one axis, not the other six — the same reasoning `normalizeConfig`
  applies to persisted state, with more force, because a link outlives the build
  that wrote it by longer.

`decodePreset` validates **every** axis itself. It cannot lean on
`normalizeConfig`, which only checks `theme` and `chartColor` against the base
colour and lets a stale `style`, `font` or `radius` through untouched.

Base64url is hand-rolled against RFC 4648 §5 rather than reaching for
`btoa`/`atob`: this module has to load under Bun's test runner, Metro, Vite's SSR
and Node's CJS config loader, and it stays dependency-free so it can.

## Composition is shadcn's, and the order IS the precedence

`resolveTokens` is the whole algorithm: a base colour's full ramp, an accent
spread over it, the chart hues overwritten, then the style's geometry, then
radius last so that axis can square a style's corner without replacing the rest
of its numbers. There is no merge strategy beyond object spread.

Two departures from shadcn, both deliberate, both asserted:

- **An accent carries no `secondary`.** shadcn hardcodes it to a zinc grey
  whatever the base colour, so stone + blue gives a stone page with a zinc
  secondary — invisible on a web card, obvious on `Button variant="secondary"`.
- **Geometry is a real axis.** shadcn's styles are stylesheets and write no
  variables at all; here a style is a bundle of numbers, so it composes with the
  palette in the same pass.

**Vega is the identity element.** It restates the library's own numbers, so
selecting it leaves an app exactly as `native-ui` ships — asserted against
`theme.css` rather than against a copy.

## `convert.ts` lives here, not in the CLI

It is `delacour theme`'s entire implementation, and it is pure — a string in, a
string out, with no imports at all. It moved for two reasons: `packages/cli` has
no `exports` map (only `bin` and `files: ["dist"]`), so nothing outside it could
import the module; and `emit.ts` needs it to produce the native `theme.css`
shape, which would otherwise be a second implementation of a shipped command.

The CLI still owns the I/O in `commands/theme.ts`, and bundles this file into its
`dist` — `tsdown.config.ts` sets `deps: { alwaysBundle: [/.*/] }`, so a workspace
dependency inlines exactly as `commander` and `zod` already do.

## Commands

```bash
bun test          # the resolve matrix, the codec, the emitters, the converter
bun run typecheck
bun run check
```
