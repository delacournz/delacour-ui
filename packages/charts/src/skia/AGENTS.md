# skia

The only folder that imports Skia values. Four small translators.

Everything below `core/` computes numbers; this turns them into things Skia can
draw. Keeping the surface this narrow is deliberate — Skia 2.x renamed and
restructured a good deal of the path API, so every future migration is these
files and nothing else.

## Files

| Path | What |
| --- | --- |
| `build-path.ts` | An SVG path string from `core/curve` into an `SkPath` |
| `font.ts` | A system font, label advance widths, and line height |

## Design

- **A path Skia cannot parse becomes an empty path, not `null`.** Every caller
  renders the result, and an empty path draws nothing — which is a chart with a
  missing series rather than a crash.

- **No font ships with this package.** `matchFont` resolves against the
  operating system's own families, so a chart is legible with no `expo-font`,
  no config plugin and no Metro asset resolver in the consuming app. The trade
  is that iOS' system font is not Android's, so the same labels measure
  differently and the plot rect differs by a few points across platforms. That
  is correct, but it does mean a screenshot baseline has to be per-platform.

- **Label width is the sum of glyph advances, not `measureText`.**
  `measureText` returns the *drawn* bounds, which exclude side bearings, so a
  tick reading "10" measures narrower than the space it occupies and every
  axis gutter comes out a point or two too tight. `getTextWidth` gives the
  advance directly but is deprecated in Skia 2.x, so the advances are summed
  from `getGlyphWidths`.

- **Line height comes from the font's metrics, not its point size.** An axis
  gutter has to reserve the full glyph box — ascent plus descent — and the
  nominal size is neither.
