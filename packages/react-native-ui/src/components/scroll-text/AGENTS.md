# ScrollText

Text that resolves unit by unit as the page scrolls past it: a paragraph that goes from dim to
full colour word by word, a headline whose words rise into place, a sentence a marker band sweeps
through. The scroll position is the clock — stop scrolling and it stops. A single component, no
parts: pattern A over `Text`.

`import { ScrollText } from "@delacour/react-native-ui/scroll-text";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-text` |
| `scroll-text.tsx` | `ScrollText` — measures, splits, lays out, renders units; plus the internal `ScrollText.Measure` |
| `scroll-text-unit.tsx` | `ScrollText.Unit`, internal: one animated unit, reading `progress` and its index |
| `scroll-text-source.ts` | `useScrollTextProgress` — the geometry worklet |
| `scroll-text.types.ts` | `ScrollTextSource`, `ScrollTextProps` |
| `scroll-text.variants.ts` | Pure `tv()` + every resolver, `splitText`, `splitGraphemes`, `splitLines`; no RN imports |
| `scroll-text.variants.test.ts` | |

## Axes

| Prop | Values | Default |
| --- | --- | --- |
| `effect` | `colour` · `fade` · `rise` · `highlight`, each a union member with only its own fields | `{ kind: "colour" }` |
| `split` | `character` · `word` · `line` | `word` |
| `overlap` | 0 (one after another) .. 1 (all together) | 0.4 |
| `source` | `screen` · `offset` (`scrollY`, optional `viewport`) · `progress` | `screen` |
| `window` | `{ start, end }` viewport fractions of the block's top edge | `{ start: 0.85, end: 0.35 }` |

Typography is `Text`'s — `size`, `weight`, `align`, `color`, `transform`, `variant`, `className` —
resolved once by `resolveTextClass` and published through `TextClassProvider`, so every unit and the
measuring text inherit the identical class.

## Design

- **It is scroll-linked, never timed.** Nothing animates on its own, so there is no loop for calm
  motion to still and nothing for a test runner to wait on. That is the line between this and a
  timed text animation, and it is why there is no `duration` anywhere in the API.
- **Progress comes from geometry, not offsets.** `useScrollTextProgress` `measure`s the block on the
  UI thread each time the trigger changes and reads its `pageY` against the viewport. A scroll
  offset is only the *trigger*; the page position is the truth, so nesting depth, headers and insets
  never have to be added up by hand. A layout pass (`onLayout` bumps a tick) is a trigger too, so a
  block that moves without a scroll re-reads its place.
- **An `offset` source may name its `viewport`.** Without one the window is a fraction of the device
  window; with the scroll view's animated ref, it is a fraction of that scroll view's own bounds.
  This was added for the bounded scroll host in the demos and is what any scroller inside a card
  needs — a window read against the whole screen would finish the reveal while the text is still
  clipped by its box. `screen` reads `Screen`'s measured `layoutHeight` where it has one.
- **Two layouts, and the reason.** React Native cannot drive a nested `<Text>`'s style from the UI
  thread, so a flowing `Text` with per-word styling would re-render on the JS thread every scroll
  event. Units are therefore sibling `Text`s in a wrapping row: `word` is one unit per word;
  `character` is one unit per grapheme, grouped in a `nowrap` row per word so a word never breaks
  mid-glyph; `line` reads the lines a hidden full `Text` reports from `onTextLayout` and renders each
  as a single-line unit in a column. The cost is written down rather than hidden: no justify, no
  hyphenation mid-text, and kerning across a unit boundary is lost.
- **The row's `columnGap` is one measured space glyph.** Spaces are not rendered — a space unit at a
  line end would hang and push a centred line off true — so the gap stands in for them, measured
  from a hidden no-break space in the block's own type. That is what makes the units wrap where a
  plain `Text` of the same string wraps. `rowGap` is 0: each unit already carries its line height.
  A newline in the source is a full-width `break`; the second and later in a run render a line of
  height, so a blank line survives.
- **`align` maps to `justify-*` on the row and `items-*` on the column.** The units are siblings,
  so `text-center` would centre each word inside itself.
- **Unmeasured, the plain string stands in** at the units' starting look — the floor, or fully
  revealed under calm motion. First paint is never blank and never flashes revealed text before
  dimming it.
- **Every unit writes only `opacity`, `transform`, `color` and `backgroundColor`.** The colour values
  come from `useThemeColor` once per theme and reach each unit as plain strings, so a frame
  interpolates two constants. The stagger (`resolveRevealProgress`) and the effect
  (`resolveEffectFrame`) are pure worklet functions in the variants file, which is how the whole
  motion model is unit-testable.
- **The stagger fits inside the window.** Slot `span = 1 / (1 + (n−1)(1−overlap))`, step
  `span·(1−overlap)`; the last unit ends exactly at 1, so the block is fully revealed the moment its
  top reaches `end`, whatever `n` and `overlap` are.
- **The text is never hidden.** `fade` and `rise` floors are clamped to at least 0.15 opacity, and the
  `colour` effect's floor is `muted-foreground`, so un-revealed text keeps contrast for someone
  scrolling slowly.
- **A default highlight is `primary` at 20%; a named one is drawn at full strength.** `primary` at full
  alpha buries the text it marks, but a caller who names `accent` chose that fill. The band fades in
  from its own colour at zero alpha (`transparentOf`), never from the keyword `transparent`, which is
  transparent *black* and would drag the band through grey. The alpha is applied by `withAlpha`,
  which handles the hex Uniwind resolves every theme colour to.
- **Calm motion pins progress to 1 with no listener.** Under reduce motion or `isMotionCalm` the text
  is fully revealed, rises nothing, and the reaction returns before measuring. Scroll-linked motion
  is the user's own, but a half-dim paragraph under a test runner is a worse failure than a missing
  flourish.
- **Outside a `Screen`, `source: "screen"` renders revealed** and warns once in development. A block
  with no clock is better legible than stuck at its floor.
- **One accessibility element, the full string, once.** The block is `accessible` with
  `accessibilityRole="text"` and `accessibilityLabel={children}`; every unit, break, the placeholder
  and the measurer are hidden from assistive technology. Otherwise VoiceOver reads forty fragments
  and TalkBack makes each a swipe stop.
- **`children` is `string`.** Splitting rich children has no defined word boundary (where is it inside
  a nested link?). Typecheck refuses the rest; a caller wanting emphasis uses two blocks.
- **`splitText` / `splitGraphemes` are a private copy.** A timed text animation keeps an identical
  pair under the same contract — `splitText(text, "character" | "word"): readonly TextUnit[]` with
  `TextUnit = { text, isSpace }` — so neither branch had to wait on the other. Hoisting both into
  `src/lib/` is a follow-up refactor, not something to do here.
- **Graphemes are split by hand, not with `Intl.Segmenter`.** Hermes has shipped without the
  segmenter, and a unit count that differs by engine is a stagger that differs by platform. The
  splitter covers combining marks (through `\p{M}`, with block ranges for an engine without property
  escapes), variation selectors, skin tones, ZWJ sequences, flag pairs, tag sequences, keycaps and
  CRLF.

## Spikes

- **`useScreenContext()` outside a `Screen`.** It returns `null` rather than throwing, so
  `source: "screen"` needed no new hook and `screen.context.tsx` is untouched.
- **Theme colour format.** Uniwind's CSS processor formats every resolved colour with `formatHex` /
  `formatHex8`, so `useThemeColor` hands back hex and the 20% highlight is a hex8 suffix rather than
  a colour parser.
- **Demo contract.** The scroll demos host the component in a bounded `Animated.ScrollView`, the
  exception written into `apps/playground/src/demos/AGENTS.md`; `scrub` drives a `progress` source
  from a `Slider` and needs no scroll at all.
