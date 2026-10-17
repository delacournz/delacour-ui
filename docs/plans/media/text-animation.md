# TextAnimation — design spec

Plan ID `media-text-animation`. Phase `media-text-animation-1`. Issue title: `TextAnimation 1 - ✨ feat:`.

## 1. Purpose on mobile

Five ways a piece of text or a number arrives, each a part of one compound:

| Part | What it does |
| --- | --- |
| `TextAnimation.Reveal` | Enters unit by unit (character / word / line) with a fade, slide or scale, staggered |
| `TextAnimation.Typing` | Types a phrase, or loops several, with a blinking caret and optional erase |
| `TextAnimation.Rotating` | Swaps one phrase for the next on an interval, in place — one word inside a sentence |
| `TextAnimation.Counting` | Tweens a number to a new value, formatted (grouping, decimals, prefix, suffix) |
| `TextAnimation.Rolling` | Odometer: each digit is a wheel that rolls to its new digit |

A picker-style scale (a value chosen by scrolling a column of options) is **out of scope**: it is an
input, not a text effect, and belongs with `Slider`/a future Picker.

- **Every part ends on the real final text.** A skipped, interrupted or calm animation must land on
  the correct string, never a half-typed or half-counted one — the animation is garnish on a fact.

## 2. Public API

`import { TextAnimation } from "@delacour/react-native-ui/text-animation";`

```ts
export const TEXT_ANIMATION_UNITS = ["character", "word", "line"] as const;
export type TextAnimationUnit = (typeof TEXT_ANIMATION_UNITS)[number];

export type TextAnimationOrder = "forward" | "reverse" | "center" | "random";

export type TextAnimationEffect =
  | { kind: "fade" }
  | { kind: "slide"; from: "up" | "down" | "left" | "right"; distance?: number }  // pt, default 12
  | { kind: "scale"; from?: number };                                             // default 0.8

type TextAnimationBase = Omit<TextProps, "children" | "style"> & { className?: string };

export type TextAnimationRevealProps = TextAnimationBase & {
  children: string;
  split?: TextAnimationUnit;                       // default "word"
  effect?: TextAnimationEffect;                    // default { kind: "fade" }
  /** Delay between consecutive units, ms. Default 40 (character) / 90 (word, line). */
  stagger?: number;
  order?: TextAnimationOrder;                      // default "forward"
  durationMs?: number;                             // per unit, default 420
  delayMs?: number;                                // before the first unit
  isActive?: boolean;                              // false holds hidden; flipping true plays. Default true
  onFinished?: () => void;                         // JS-side, once per play
};

export type TextAnimationCaret =
  | { kind: "none" }
  | { kind: "bar"; blinkMs?: number }              // default blinkMs 530
  | { kind: "block"; blinkMs?: number };

export type TextAnimationTypingProps = TextAnimationBase & {
  /** One phrase types once and holds. Several cycle. */
  children: string | readonly string[];
  caret?: TextAnimationCaret;                      // default { kind: "bar" }
  /** Characters per second. Default 22. */
  speed?: number;
  /** Erase speed, chars/s. 0 = no erasing, next phrase replaces. Default 40. */
  eraseSpeed?: number;
  holdMs?: number;                                 // pause on a finished phrase, default 1400
  loop?: boolean;                                  // default: true when several phrases
  isActive?: boolean;
  onPhraseTyped?: (index: number) => void;
};

export type TextAnimationRotatingProps = TextAnimationBase & {
  phrases: readonly string[];                      // >= 1
  intervalMs?: number;                             // default 2200
  transition?: { kind: "fade" } | { kind: "slide"; distance?: number }; // slide is vertical, default 14
  transitionMs?: number;                           // default 360
  /** Reserve the widest phrase's width so a sentence does not reflow. Default "widest". */
  reserve?: "widest" | "current";
  isActive?: boolean;
};

export type TextAnimationNumberFormat = {
  decimals?: number;                               // default 0
  groupSeparator?: string;                         // default ","; "" disables
  decimalSeparator?: string;                       // default "."
  prefix?: string;
  suffix?: string;
};

export type TextAnimationCountingProps = TextAnimationBase & {
  value: number;
  from?: number;                                   // first mount start, default 0
  format?: TextAnimationNumberFormat;
  durationMs?: number;                             // default 900
  easing?: "linear" | "out" | "inOut";             // default "out"
  animateOnMount?: boolean;                        // default true
};

export type TextAnimationRollingProps = TextAnimationBase & {
  value: number;
  format?: TextAnimationNumberFormat;              // same shape; separators render static
  durationMs?: number;                             // default 600
  stagger?: number;                                // ms between wheels, least significant first, default 40
};

export const TextAnimation = Object.assign(TextAnimationReveal, {
  /** Types a phrase, or cycles several, with a caret. */ Typing: TextAnimationTyping,
  /** Swaps one phrase for the next in place. */ Rotating: TextAnimationRotating,
  /** Tweens a formatted number. */ Counting: TextAnimationCounting,
  /** Odometer digit wheels. */ Rolling: TextAnimationRolling,
  displayName: "DelacourUI.TextAnimation",
});
```

**The root is `Reveal`** (the common case), so `<TextAnimation split="word">Hello</TextAnimation>` works and
the other four are parts; `TextAnimation.Reveal` is not a separate slot. A `TextAnimation.Provider` for shared
configuration is deferred.

## 3. File map

| File | Holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/text-animation` |
| `text-animation.tsx` | `TextAnimationReveal` root + `Object.assign` |
| `text-animation-typing.tsx` / `-rotating.tsx` / `-counting.tsx` / `-rolling.tsx` | One part each |
| `text-animation-unit.tsx` | Internal leaf: one animated unit, shared by Reveal and Typing |
| `text-animation-clock.ts` | `useTextAnimationClock` — frame-callback elapsed-ms shared value, pausable |
| `text-animation.types.ts` | Shared prop types (`TextAnimationBase`, effect, format) |
| `text-animation.variants.ts` | `tv()` + all pure resolvers, `splitText`, `splitGraphemes`, `formatNumber` — no RN imports |
| `text-animation.variants.test.ts` | |
| `AGENTS.md` | |

Parts are not re-exported from `index.ts`. DisplayNames: `DelacourUI.TextAnimation`,
`.Typing`, `.Rotating`, `.Counting`, `.Rolling`, `.Unit`, `.Caret`, `.Wheel`.

## 4. Variants & sizes

Typography is `Text`'s: `size`, `weight`, `font`, `align`, colour classes, resolved by
`resolveTextClass` and applied to every unit. Local axes: `effect.kind`, `caret.kind`
(`bar`: `w-0.5 h-[1em]` bg `foreground`; `block`: `w-[0.6em]` bg `foreground/40`), `order`, `unit`.
The caret takes the text colour via a token class, never a literal. `Rolling` needs
tabular figures; if Uniwind exposes `tabular-nums`, use it, else set `fontVariant` through a
single non-className style (verify on device).

## 5. States

| State | Reveal / Typing | Rotating | Counting / Rolling |
| --- | --- | --- | --- |
| idle (`isActive=false`) | Hidden (Reveal) / empty with caret (Typing) | First phrase shown | Shows `from` |
| playing | Units entering / chars typed | Interval timer running | Tweening |
| finished | All units at rest; Typing holds or loops | n/a | Shows `value` |
| calm / reduce motion | **Final text immediately**, no stagger, no caret blink | First phrase, **no rotation** (a rotating word is a loop) | **`value` immediately**, no tween |
| interrupted (props change) | Replay from start; stale callbacks dropped by a run id | Phrases list change resets to index 0 | Retargets from the *current* displayed value, not from `from` |

## 6. Accessibility

- **Screen readers get the final plain text once.** Container `accessible`, `accessibilityRole="text"`,
  `accessibilityLabel` = the full final string (Reveal/Typing: last phrase when typing several;
  Rotating: current phrase; Counting/Rolling: the **formatted target value**, not the in-flight
  one). Every unit, wheel, caret and measuring text is hidden
  (`importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden`). Without it
  Rolling reads "0 0 0 0 1 2 3" mid-roll and Typing speaks every keystroke.
- **Rotating and Counting do not announce on change** (no live region) by default — a screen reader
  chattering every 2 s is hostile. `announce?: boolean` is not exposed in v1.
- Reduce motion / `isMotionCalm` → §5. Counting's value is information, so it is shown, not delayed.
- Font scaling honoured; Rolling's wheel height is measured, not fixed.

## 7. Motion

- **One elapsed-ms clock per instance**: `useFrameCallback` adds `dt` to a `elapsed` shared value while
  active. Every part is a pure function of `elapsed` — pausable, seekable, and the same code path for
  tests and for clips. `withTiming` per unit would need N animations and cannot be stopped mid-stagger.
- **Reveal**: unit `i` local time = `elapsed − delay − resolveStaggerDelay(i, n, stagger, order)`;
  progress = clamp(local / duration) through `Easing.out(cubic)`. Style writes only `opacity` +
  `transform`. Layout is final from frame 0 (units rendered at opacity 0) — **text never reflows while
  it enters**.
- **Units are siblings in a wrapping row** (same reason as `ScrollText`: nested `Text` can't be
  animated on the UI thread). `character` groups per word in a `nowrap` row; `line` uses a hidden
  measuring `Text` + `onTextLayout`. `order: random` is **seeded** by `hash(text)` so replays and clips
  are repeatable.
- **Typing**: all characters laid out from the start at opacity 0 (so a wrapped paragraph does not re-wrap
  as it types). Visible count = `floor(resolveTypedCount(elapsed))`; character `i` opacity 1 when
  `i < count`. Caret lives *inside* the last-typed cell as an absolute `right-0` bar with opacity
  `blink(elapsed)` — no per-char measurement. Phrase boundaries (type → hold → erase → next) come from a
  precomputed timeline; the phrase index crosses to JS (`scheduleOnRN`) only at boundaries, to swap the
  rendered string. Between phrases of different lengths the box keeps the tallest wrapped height
  (`reserve`) so surrounding layout does not jump.
- **Rotating**: container sized by an invisible widest phrase (`resolveWidestPhrase`, by grapheme count then
  verified by one `onLayout`); current and next overlap during `transitionMs`. Index is JS state advanced by
  a timer set from `intervalMs` — not a frame loop — and paused with `isActive`.
- **Counting**: value rendered through an `AnimatedTextInput` (`editable={false}`, `pointerEvents="none"`,
  zero padding, `Text` classes) whose `text` prop is an animated prop computed by the `formatNumber`
  worklet. Hermes worklets have no `Intl`, so grouping/decimals are hand-written. **Risk, decided
  up front:** TextInput metrics can differ from `Text` (Android font padding, line height). If the simulator
  check shows a mismatch, Counting is rebuilt on `Rolling`'s wheels with `stagger=0` — the public API
  does not change.
- **Rolling**: each digit is a clipped window (height = measured line height) over a column `0..9`;
  `translateY = −pos · lineHeight`. `pos` is cumulative so 9→0 on an increase rolls *forward* through
  the wrap (`resolveRollTarget`), not backwards through 8..1. Non-digits are static cells; digits count
  growing (999 → 1000) mounts the new wheel at 0 and rolls it. Wheels are least-significant first with `stagger`.
- Speeds are chars/s and ms, never "a duration for the whole thing" — typing a sentence twice as long
  takes twice as long.

## 8. Reuses

`Text` (`resolveTextClass`, `Text.ClassProvider` for inherited colour), `useCalmMotion`, `useThemeColor`
(caret), `cn`, `tv`, Reanimated (`useFrameCallback`, `useAnimatedStyle`, `useAnimatedProps`,
`Easing`, `scheduleOnRN` from `react-native-worklets`), React Native `TextInput` (Counting only).
No `Screen` coupling.

## 9. Dependencies

None new. `react-native-worklets` and Reanimated are existing peers; confirm `react-native-worklets` is
in `PACKAGE_INSTALL`. `ITEM_META["text-animation"]`:
`{ title: "TextAnimation", description: "Five ways a piece of text or a number arrives — reveal, typing, rotating, counting, rolling.", categories: ["display"] }`.

## 10. Sibling / cross-category dependencies

- **Imports no sibling.** Not `scroll-text`, `marquee`, `circular-text`.
- **Text-splitting helper: private copy.** `splitText` + `splitGraphemes` are duplicated from the
  contract in `scroll-text.md` §10 (`splitText(text, "character" | "word"): readonly TextUnit[]`,
  `TextUnit = { text: string; isSpace: boolean }`), each with its own tests. Parallel branches need no
  wave order; a later `♻️` can move both to `src/lib/split-text.ts`. Keep the two copies byte-identical
  where possible so that refactor is a delete.
- **Cross-category**: none missing (`Text`, Reanimated, worklets exist). `useCalmMotion` exists.
  No `Number`/`Counter` component exists; `Counting` is the library's first — if a `Kpi` wants it later, `Kpi`
  imports the leaf; not in this scope.

## 11. Pure logic to unit-test (TDD)

```ts
splitGraphemes(text: string): readonly string[]
splitText(text: string, unit: "character" | "word"): readonly TextUnit[]
resolveStaggerDelay(index: number, count: number, stagger: number, order: TextAnimationOrder, seed?: number): number
resolveUnitProgress(elapsedMs: number, delayMs: number, staggerDelayMs: number, durationMs: number): number
resolveEffectFrame(effect: TextAnimationEffect, t: number): { opacity: number; translateX: number; translateY: number; scale: number }
resolveTotalDuration(count: number, stagger: number, durationMs: number, delayMs: number): number
buildTypingTimeline(phrases: readonly string[], opts: { speed: number; eraseSpeed: number; holdMs: number; loop: boolean }): TypingTimeline
sampleTypingTimeline(timeline: TypingTimeline, elapsedMs: number): { phraseIndex: number; visibleCount: number; phase: "typing" | "holding" | "erasing" }
resolveCaretOpacity(elapsedMs: number, blinkMs: number, isTyping: boolean): 0 | 1
resolveNextPhrase(index: number, count: number, loop: boolean): number | null
resolveWidestPhrase(phrases: readonly string[]): number          // index, by grapheme count
formatNumber(value: number, format: TextAnimationNumberFormat): string  // 'worklet'
resolveRollTarget(currentPos: number, digit: number, direction: "up" | "down"): number
splitNumberCells(formatted: string): readonly ({ kind: "digit"; digit: number } | { kind: "static"; text: string })[]
```

Cases: `resolveStaggerDelay(0,4,40,"forward")=0`, `(3,4,40,"forward")=120`, `"reverse"` mirrors, `"center"` on 5 →
`[80,40,0,40,80]`, `"random"` with the same seed twice is identical and a permutation of `0..n−1 · stagger`.
`splitText("a b", "word")`; family emoji and flags as one grapheme. `sampleTypingTimeline`: at 0 → visible 0
typing; at `len/speed` → full, holding; during erase decreasing; `loop:false` last phrase holds forever;
`eraseSpeed:0` jumps. `formatNumber(1234567.891,{decimals:2})="1,234,567.89"`, `{groupSeparator:""}`, `{decimalSeparator:","}`,
negative `−1,234`, `0.5` with `decimals:0` → `"1"` (matches `toFixed` rounding; assert half-cases), `prefix:"$"`,
`NaN`/`Infinity` → `"—"`. `resolveRollTarget(9, 0, "up") = 10`, `(0, 9, "down") = −1`, otherwise unchanged
modulo 10. `resolveCaretOpacity` toggles every `blinkMs`, always 1 while typing. `resolveTotalDuration` matches the last unit finishing.

## 12. Playground demos

`apps/playground/src/demos/text-animation/`

| File | Shows | Capture |
| --- | --- | --- |
| `reveal-words.tsx` | Headline, word fade-slide, replay on a `Button` — **`hero`** | clip |
| `reveal-characters.tsx` | Character scale-in, `order="center"` | clip |
| `typing.tsx` | Two phrases typed and erased with a bar caret | clip |
| `rotating.tsx` | "Built for [fast ▾] teams" — one word rotating in a sentence | clip |
| `counting.tsx` | A currency figure counting to a new value on tap | clip (flow taps) |
| `rolling.tsx` | An odometer rolling 1,248 → 9,731 | clip (flow taps) |
| `orders.tsx` | forward / reverse / center / random side by side | gallery only |

Route `apps/playground/src/app/(components)/text-animation.tsx`; row in `src/app/index.tsx`.

## 13. Docs page

`apps/web/content/docs/native/components/text-animation.mdx`: hero · Installation · Usage · Anatomy (five
parts) · Reveal (effects, split, stagger, order) · Typing (caret, several phrases) · Rotating (one word in a
sentence, `reserve`) · Counting (formatting) · Rolling · Why nothing reflows · What a screen reader gets ·
Reduced motion · API reference per part. `meta.json`: `"text-animation"` after `"text"` in **Data Display**.

## 14. Acceptance checklist

- [ ] `text-animation.variants.test.ts` first, red→green
- [ ] typecheck, `bun run check`; no `any`; no JSX comments; discriminated unions for effect/caret/transition
- [ ] displayName on root, every part, `Unit`, `Caret`, `Wheel`
- [ ] `AGENTS.md` + **Components** table row; `gen-exports`
- [ ] demos, `gen-demos`, route, index row
- [ ] docs page + `meta.json`
- [ ] `ITEM_META["text-animation"]`; `registry:build`; `verify:expo`
- [ ] changeset (minor)
- [ ] Simulator check via `warden` + `agent-device`; lease released
- [ ] Calm verified: Reveal/Typing/Counting/Rolling show final text on first frame; Rotating holds phrase 0
- [ ] Interrupt mid-animation (change `value`/`children`) lands on the correct final text, no stale callback
- [ ] Wrapped paragraph does not re-wrap while Reveal/Typing play
- [ ] Counting: TextInput metrics match `Text` on iOS and Android, else switch to wheels (documented)
- [ ] Rolling 9→0 rolls forward; digit-count growth (999→1000) correct; no sideways jitter (tabular figures)
- [ ] VoiceOver reads the final string once for every part; no per-glyph fragments
- [ ] `Intl` not referenced inside any worklet
- [ ] 1000-character Reveal stays 60fps on a mid-tier device (units are cheap leaves; measure)
