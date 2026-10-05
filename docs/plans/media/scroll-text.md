# ScrollText — design spec

Plan ID `media-scroll-text`. Single phase `media-scroll-text-1`. Issue title: `ScrollText 1 - ✨ feat:`.

## 1. Purpose on mobile

Text that resolves unit by unit as the page scrolls past it: a manifesto paragraph that goes from dim
to full colour word by word, a headline whose words rise into place, a sentence highlighted as the
reader reaches it. The scroll position is the clock; stop scrolling and it stops.

- **It is scroll-linked, not time-based.** Nothing animates by itself, so there is no loop to still and
  nothing to wait on. That is what separates it from `TextAnimation`.
- **It must never hide text from a reader.** Every effect has a legible floor (dim, not invisible, by
  default) and reduce motion pins the text fully revealed.

## 2. Public API

`import { ScrollText } from "@delacour/react-native-ui/scroll-text";`

```tsx
<Screen.ScrollArea>
  <ScrollText size="2xl">We build interfaces that move when you do.</ScrollText>
</Screen.ScrollArea>

<ScrollText source={{ kind: "offset", scrollY }} effect={{ kind: "rise", distance: 12 }} split="word">…</ScrollText>
<ScrollText source={{ kind: "progress", progress }}>…</ScrollText>
```

```ts
export const SCROLL_TEXT_SPLITS = ["character", "word", "line"] as const;
export type ScrollTextSplit = (typeof SCROLL_TEXT_SPLITS)[number];

/** Theme tokens (raw names, read with useThemeColor), never literals. */
export type ScrollTextColor = "foreground" | "muted-foreground" | "primary" | "accent" | "border";

export type ScrollTextEffect =
  | { kind: "colour"; from?: ScrollTextColor; to?: ScrollTextColor }      // default muted-foreground -> foreground
  | { kind: "fade"; from?: number }                                       // opacity floor, default 0.15
  | { kind: "rise"; distance?: number; from?: number }                    // pt, default 14; opacity floor 0.15
  | { kind: "highlight"; color?: ScrollTextColor; from?: ScrollTextColor }; // background band behind the unit

/** Where the progress comes from. */
export type ScrollTextSource =
  | { kind: "screen" }                                      // default: Screen's published scrollY
  | { kind: "offset"; scrollY: SharedValue<number> }        // any scrollable's offset
  | { kind: "progress"; progress: SharedValue<number> };    // already 0..1, geometry is the caller's

/** Viewport fractions (0 top .. 1 bottom) of the block's TOP edge: 0 progress at `start`, 1 at `end`. */
export type ScrollTextWindow = { start: number; end: number }; // default { start: 0.85, end: 0.35 }

export type ScrollTextProps = Omit<TextProps, "children" | "style"> & {
  children: string;                       // plain text only — see §6
  effect?: ScrollTextEffect;              // default { kind: "colour" }
  split?: ScrollTextSplit;                // default "word"
  /** 0 = units reveal one after another, 1 = all together. Default 0.4. */
  overlap?: number;
  source?: ScrollTextSource;
  window?: ScrollTextWindow;
  className?: string;                     // Text preset classes: size, weight, align, colour tokens
};
export const ScrollText: ((props: ScrollTextProps) => ReactElement) & { displayName: string };
```

`ScrollText` is a single component (no parts) — the root takes `Text`'s axes (`size`, `weight`, `align`,
`font`) by extending `TextProps`, so it speaks the type scale. It is a pattern-A wrapper over `Text`.
`source` and `effect` are discriminated unions; an `offset` source without a `scrollY` is unrepresentable.

## 3. File map

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-text` |
| `scroll-text.tsx` | `ScrollText` — measures, splits, lays out, renders units |
| `scroll-text-unit.tsx` | Internal leaf: one animated unit, reads `progress` + its index |
| `scroll-text-source.ts` | `useScrollTextProgress(source, window, ref)` — the geometry worklet |
| `scroll-text.types.ts` | Prop types shared by the files above |
| `scroll-text.variants.ts` | `tv()` for the wrap row + pure resolvers + `splitText` + `splitLines`, no RN imports |
| `scroll-text.variants.test.ts` | |
| `AGENTS.md` | |

Displaynames: `DelacourUI.ScrollText`, `DelacourUI.ScrollText.Unit`, `DelacourUI.ScrollText.Measure`.

## 4. Variants & sizes

Typography comes from `Text`: `size`, `weight`, `align`, `font`, `tracking` — resolved by
`resolveTextClass`, then applied to each unit **and** the hidden measuring text, so lines break
identically. Local axes: `effect.kind`, `split`, `overlap`. The wrap container is
`flex-row flex-wrap` with `rowGap`/`columnGap` derived from the resolved font size (one measured
space glyph, see §7); `align` maps to `justify-start|center|end` on the row.

## 5. States

| State | Behaviour |
| --- | --- |
| unmeasured | Hidden measuring `Text` renders the full string at the real width; units appear only once `onTextLayout` (lines) / `onLayout` (block) return. Until then the plain text is shown at the resting colour, so first paint is never blank. |
| at rest, before window | Every unit at its floor (`from` values) |
| scrolling | Units interpolate by `resolveRevealProgress` |
| after window | Fully revealed; stays revealed when scrolling back past (no hysteresis) |
| reduce motion / `isMotionCalm` | Progress pinned to 1: text fully revealed, no translation, no listener. Rationale: user-driven, but a half-dim paragraph under a test runner is a worse failure than a missing flourish. |
| outside a scroller, `source: screen` | Dev-only warning once; renders revealed (progress 1) |

## 6. Accessibility

- **One element, the full string, once.** The container is `accessible`,
  `accessibilityRole="text"`, `accessibilityLabel={children}`; every unit and the measuring text are
  `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden`. Otherwise
  VoiceOver speaks 40 fragments, and on Android each fragment is a separate swipe stop.
- **`children` is `string`, not `ReactNode`.** Splitting rich children is undefined (where is the word
  boundary inside a nested link?). A caller needing emphasis uses two components. Typecheck refuses the rest.
- **Reduce motion** → §5. Dim floors never go below 0.15 opacity / `muted-foreground` so un-revealed
  text keeps contrast for low-vision users scrolling slowly.
- Dynamic Type: units use `Text`, so `allowFontScaling` applies; the layout is measured, not fixed.

## 7. Motion

- **Progress comes from geometry, not offsets.** `measure(animatedRef)` on the UI thread yields the
  block's `pageY` every time the scroll source changes, so nesting depth, headers and insets never
  need to be added up by hand. `source: offset|screen` is the *trigger*; `pageY` is the truth.
  The viewport is `useWindowDimensions()` height, overridden by `Screen`'s measured layout when the
  text sits inside one.
- **`resolveScrollProgress(top, viewportHeight, window)`** = clamp((start·vh − top) / ((start − end)·vh)).
  `source: progress` bypasses it. A window with `start <= end` is invalid and falls back to default.
- **Per-unit progress is staggered by overlap**: slot `span = 1 / (1 + (n−1)(1−overlap))`, step
  `span·(1−overlap)`, unit `i` local = clamp((p − i·step)/span). `overlap = 1` is everyone together;
  `0` is strictly sequential. `resolveRevealProgress` is the one function every effect reads.
- **Two layouts, and the reason**: React Native cannot drive a nested `<Text>`'s style from the UI
  thread, so a flowing `Text` with per-word styling would re-render the JS thread every scroll event.
  Units are therefore sibling `Animated.Text`/`Animated.View` in a wrapping row:
  `word` → one unit per word; `character` → one unit per grapheme, grouped in a `nowrap` row per
  word so a word never breaks mid-glyph; `line` → a hidden full `Text` reports `onTextLayout` lines,
  `splitLines` turns them into units, each rendered as a single-line `Animated.Text`
  (`numberOfLines={1}`). Cost: no justify, no mid-text hyphenation; documented.
- **Re-layout is rare.** Splitting is `useMemo` on `(text, split)`; line layout re-measures on width change only.
- **Each unit's animated style writes only `opacity`, `transform`, `color` or `backgroundColor`.**
  `interpolateColor` receives colour values from `useThemeColor` resolved once, not per frame; theme
  changes re-resolve them.
- Highlight: band is the unit's `backgroundColor`, rounded via `rounded-sm` on the unit, interpolated
  from `from` (default transparent) to `color` (default `primary` at 20%, derived through the colour helper).

## 8. Reuses

`Text` + `resolveTextClass` + `Text.ClassProvider` (typography inheritance), `useThemeColor`,
`useCalmMotion`, `useScreenContext`/`scrollY` from `screen` (leaf import `screen.context`, per rule 3
— never `../screen`), `cn`, `tv`. `Screen.ScrollArea`/`FlatList` already publish `scrollY`, so
`source: screen` needs no wiring. Reanimated: `useAnimatedRef`, `measure`, `useAnimatedReaction`,
`useAnimatedStyle`, `interpolate`, `interpolateColor`.

## 9. Dependencies

None new. Existing peers only. `ITEM_META["scroll-text"]`: `{ title: "ScrollText", description: "Text that resolves word by word as you scroll.", categories: ["display"] }`.
Registry will list `text` and `screen` as registry dependencies (derived from imports) — expected.

## 10. Sibling / cross-category dependencies

- **Imports no sibling.** Not `text-animation`.
- **Text-splitting helper decision: private copy in each, not a shared owner.** Both need
  `splitText(text, unit)` with the same grapheme contract. A shared file would force either a wave order
  (one branch must merge before the other can import it) or a leaf import across folders — and an
  installed registry item would then silently depend on the sibling's folder. Parallel branches
  win: `scroll-text.variants.ts` and `text-animation.variants.ts` each export an identical
  `splitText` + `splitGraphemes`, each with its own tests. Duplication is ~40 lines. After both land,
  an optional `♻️ refactor` moves it to `src/lib/split-text.ts` (gen-exports covers `lib/`), deleting both copies.
  Lock the contract in both specs: `splitText(text: string, unit: "character" | "word"): readonly TextUnit[]`
  where `type TextUnit = { text: string; isSpace: boolean }`.
- **Depends on `screen` (existing).** Needs `useScreenContext().scrollY` — confirm it is readable
  outside a Screen without throwing; if it throws, add a non-throwing `useOptionalScreen()` to
  `screen.context.tsx` as a tiny separate commit **before** this lands (wave 0, owner: this branch).
- **Demo contract gap**: `demos/AGENTS.md` bans a scroll view in a demo. This component can't be shown
  without one. Resolution proposed: a demo may host the component in a *bounded* scroll container
  (`h-80`) because the host is part of the specimen, plus a `Slider`-scrubbed `source: progress` demo that
  needs no scroll. Lead to approve the contract wording.

## 11. Pure logic to unit-test (TDD)

```ts
splitGraphemes(text: string): readonly string[]
splitText(text: string, unit: "character" | "word"): readonly TextUnit[]
splitLines(lines: readonly string[]): readonly TextUnit[]
resolveScrollProgress(top: number, viewportHeight: number, window: ScrollTextWindow): number
resolveRevealProgress(progress: number, index: number, count: number, overlap: number): number
resolveScrollTextWindow(window?: ScrollTextWindow): ScrollTextWindow
resolveEffectFloor(effect: ScrollTextEffect): { opacity: number; translate: number }
resolveEffectFrame(effect: ScrollTextEffect, t: number): { opacity: number; translate: number; colorT: number; fillT: number }
resolveRiseDistance(effect, isReduceMotion: boolean): number
```

Cases: `splitText("Hi there", "word")` → `[Hi][ ][there]` with the space flagged; consecutive spaces stay one
unit; `"👨‍👩‍👧 ok"` char split keeps the ZWJ family as one grapheme; `"é"` one grapheme;
`"🇳🇿🇦🇺"` two units; `"👍🏽"` one; empty string → `[]`. `resolveRevealProgress(0.5, 0, 4, 0) === 1`,
`(0.5, 2, 4, 0) === 0`, `(p, i, n, 1)` equals `clamp(p)` for all i; `n = 1` equals `clamp(p)`;
monotonic non-decreasing in `p`; the sum of unit starts + span ≤ 1. `resolveScrollProgress` is 0 at
`top = start·vh`, 1 at `end·vh`, clamps both sides; invalid window → default. `resolveRiseDistance(..., true) === 0`.
`resolveEffectFrame({kind:"fade"}, 0)` opacity equals `from`; `1` equals 1 for every kind.

## 12. Playground demos

`apps/playground/src/demos/scroll-text/` — scroll demos use a bounded `Animated.ScrollView` host
(see §10) and drive `source: { kind: "offset" }`.

| File | Shows | Capture |
| --- | --- | --- |
| `colour.tsx` | A paragraph going muted → foreground word by word — **`hero`** | clip (flow scrolls) |
| `rise.tsx` | Headline words rising and fading in | clip |
| `highlight.tsx` | A marker band sweeping through a sentence | clip |
| `characters.tsx` | `split="character"`, `overlap` low, a short slogan | clip |
| `lines.tsx` | `split="line"`, a paragraph reveals line by line | clip |
| `scrub.tsx` | `source: progress` driven by a `Slider` — the same text, by hand | gallery only |

Route `apps/playground/src/app/(components)/scroll-text.tsx`; row in `src/app/index.tsx`. Flows scroll by
a fixed distance with `testID`d scroll host.

## 13. Docs page

`apps/web/content/docs/native/components/scroll-text.mdx`. Outline: hero preview · Installation · Usage
(inside `Screen.ScrollArea`) · Wiring the scroll position (`screen` / `offset` / `progress`) · The four
effects · Splitting and stagger (`split`, `overlap`) · Setting the window · Driving it from something
else · Why units are siblings (two layouts) · Reduced motion · Accessibility · API reference. `meta.json`:
add `"scroll-text"` after `"text"` in **Data Display**.

## 14. Acceptance checklist

- [ ] `scroll-text.variants.test.ts` first and red→green (`bun test …/scroll-text`)
- [ ] `bun run typecheck`, `bun run check`; no `any`; no JSX comments
- [ ] displayName on root and every internal leaf
- [ ] `AGENTS.md` + row in **Components** table; `bun run gen-exports`
- [ ] demos + `bun run gen-demos` + route file + `src/app/index.tsx` row
- [ ] docs page + `meta.json`
- [ ] `ITEM_META["scroll-text"]`; `registry:build`; `verify:expo`
- [ ] changeset (minor)
- [ ] Simulator check via `warden claim` + `agent-device`; release lease after
- [ ] Calm/reduce-motion: text fully revealed, a11y tree unchanged
- [ ] VoiceOver/TalkBack: full string read once, no fragments
- [ ] Line wrapping of units matches a plain `Text` of the same string (compare screenshot overlay) at 3 widths and 2 font scales
- [ ] `character` split on emoji + CJK + combining marks does not break a glyph
- [ ] Scroll back past the window keeps text revealed; fast fling has no flash of full-opacity text
- [ ] JS thread stays idle while scrolling (no per-event `setState`; check with perf monitor)
- [ ] Inside a `Screen` with a navbar and a footer, progress matches the window fractions (insets handled by `measure`)
- [ ] Demo-contract exception for the bounded scroll host approved by lead
