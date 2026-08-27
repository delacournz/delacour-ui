# @delacour/brand — The Delacour mark

One set of numbers, and the master art they describe. Every rendering of the mark in this
repository resolves here: the playground's launcher icons, its react-native-svg components,
the docs site's favicon set and the docs site's inline glyph.

Source-only, like [`@delacour/types`](../types/AGENTS.md) — no build step, consumers bundle
the raw TypeScript.

## Files

| File | What it holds |
| --- | --- |
| `assets/icon-source.svg` | The master art. Hand-authored vector, **the only file a designer edits** |
| `src/geometry.ts` | Every number in that SVG, as constants, plus `delacourIconSvg()` |
| `src/geometry.test.ts` | The gate that pins the two together |
| `src/source.ts` | `readIconSource()` — the master art off disk, for generators |
| `src/index.ts` | `export * from "./geometry"` |

## Two entry points, on purpose

```ts
import { DELACOUR_STROKE_COLOUR, delacourIconSvg } from "@delacour/brand";
import { readIconSource } from "@delacour/brand/source";
```

The main entry imports nothing at all — not React, not React Native, not `node:fs` — so it
can be reached from a browser bundle, a Metro bundle and `bun test` alike. `./source` reaches
for `node:fs` and is therefore only ever imported by a generator running under Bun. Keep that
line where it is: pulling `readFileSync` into `geometry.ts` would break every app that draws
the mark.

## The geometry is the contract

The art is two 262.4px squares rotated 45° about cy 428.5 / 595.5, stroked 66.4 with **miter**
joins. The joins are not decoration. A mitered 90° corner puts its tip `(stroke / 2) / sin 45°`
past the vertex, so a stroked, rotated square reaches exactly as far as a bare
`SQUARE + STROKE` square would — 232.5px from its centre, not the 218.7px the intuitive
`SQUARE / √2 + STROKE / 2` gives. `DELACOUR_GLYPH_HALF_EXTENT` carries that, and
`DELACOUR_GLYPH_VIEW_BOX` and the Android safe-zone inset are both derived from it. Round the
joins and every one of those numbers is ~47px wrong.

`bun test` fails if `assets/icon-source.svg` and the constants disagree, which is what makes
it safe for four different renderers to read the constants rather than the file.

## Changing the art

1. Edit `assets/icon-source.svg`.
2. Bring `src/geometry.ts` to match.
3. `bun test` — the gate above.
4. Regenerate every consumer's rasters and commit them:
   ```sh
   cd apps/playground && bun run icons    # launcher + adaptive + tinted PNGs
   cd apps/web        && bun run icons    # favicons, PWA icons, apple-touch-icon
   ```

Both generators use [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js), so neither needs
librsvg, ImageMagick or a simulator — they run anywhere `bun` does, including CI. Their output
is committed anyway, because nothing in `build` regenerates it.

Conventions inherit from the [root AGENTS.md](../../AGENTS.md).
