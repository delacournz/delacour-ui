# TextAnimation

Five ways a piece of text or a number arrives, on one clock: the root reveals a
string unit by unit, `Typing` types a phrase or cycles several with a caret,
`Rotating` swaps one word in place inside a sentence, `Counting` tweens a
formatted number, and `Rolling` rolls an odometer. A picker-style scale is out of
scope — it is an input, not a text effect.

`import { TextAnimation } from "@delacour/react-native-ui/text-animation";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/text-animation` |
| `text-animation.tsx` | The `Reveal` root + the `Object.assign` compound surface |
| `text-animation-typing.tsx` | `TextAnimation.Typing` |
| `text-animation-rotating.tsx` | `TextAnimation.Rotating`, and its internal `Rotating.Layer` |
| `text-animation-counting.tsx` | `TextAnimation.Counting` — a read-only `TextInput` written by an animated prop |
| `text-animation-rolling.tsx` | `TextAnimation.Rolling`, and its internal `Wheel` |
| `text-animation-unit.tsx` | Internal leaf: one animated unit, shared by Reveal and Typing; `useTextAnimationClass` |
| `text-animation-caret.tsx` | Internal leaf: the typing caret |
| `text-animation-clock.ts` | `useTextAnimationClock` — a frame-callback elapsed-ms shared value, pausable, keyed by run |
| `text-animation.types.ts` | `TextAnimationBase`, the props every part shares |
| `text-animation.variants.ts` | The slotted `tv()` + every pure resolver: splitting, stagger, effect frames, typing timeline, number format, roll targets |
| `text-animation.variants.test.ts` | |

## The root is Reveal

- **`<TextAnimation>` is `Reveal`, not a container.** Revealing a string is the
  common case, so `<TextAnimation split="word">Hello</TextAnimation>` works with
  no part; the other four hang off it. There is no `TextAnimation.Reveal` slot and
  no shared-configuration provider in v1.
- **Every part takes the `Text` axes and joins the `Text` cascade.**
  `useTextAnimationClass` resolves `variant` / `size` / `weight` / `color` /
  `align` / `transform` through `resolveTextClass`, with whatever an enclosing
  `Text` published, and applies the one class to every text the part draws — a
  unit, a cell, a layer, a wheel. `className` is merged into that class, so it is
  a text class, not a layout one; wrap the part in a `View` to place it.
- **`TextAnimationBase` takes the plain React Native text props, not `Text`'s
  animated ones.** `Text`'s props are `Animated.Text`'s, so `allowFontScaling`
  there admits a shared value — which a part forwarding one prop to forty texts
  has no use for, and which no plain `Text` accepts.

## One clock

- **Every part that animates per frame is a pure function of one elapsed-ms
  shared value.** `useTextAnimationClock` adds each frame's `dt` while running.
  A unit's progress, the typed count and the caret's blink are all read off it, so
  the animation pauses, replays and seeks without a `withTiming` per unit — which
  would be N animations, none of them stoppable mid-stagger.
- **A run is identified by a key; a new key rewinds and drops the old run's
  callbacks.** Changing the text, the timing or `isActive` builds a new key. A
  limit crossed by a superseded run is ignored on the JS side by run number, so
  an interrupted reveal never fires its predecessor's `onFinished`. `Typing` does
  the same for `onPhraseTyped` and its phrase swaps by comparing the run key the
  worklet captured with the current one.
- **`Rotating`, `Counting` and `Rolling` do not use the clock.** A rotating word
  is still between swaps, so a JS timer advances its index; a count and a roll are
  one tween each, where `withTiming` from the current value is exactly the
  retargeting behaviour wanted.

## Nothing reflows

- **Units are siblings in a wrapping row, laid out at opacity 0 from frame 0.**
  React Native cannot drive a nested `<Text>`'s style from the UI thread, so a
  revealed paragraph is a `flex-row flex-wrap` of `Animated.Text` leaves whose
  animated style writes only `opacity` and `transform`. Layout is final before
  the first unit moves.
- **A `character` split holds each word on one row.** The graphemes of a word sit
  in a non-wrapping row, so a word never breaks mid-glyph; whitespace stays a
  static cell, which is where the outer row wraps. A newline is a full-width break,
  since a wrapping row has no line feed.
- **A `line` split reads its breaks from the platform.** A hidden copy of the
  paragraph reports `onTextLayout`, and each line renders as one unit over it.
  Until the lines arrive the copy holds the space, in flow, so nothing jumps.
- **`Typing` lays out every character of the current phrase, then shows them.**
  The caret is inside the last typed cell — an absolute bar on its right edge, or
  a translucent block the width of an invisible copy of the next glyph — so no
  character is ever measured. A hidden copy of each phrase reports its wrapped
  height and the box keeps the tallest, so a short phrase after a long one moves
  nothing below it.
- **`Rotating` reserves its widest phrase.** An invisible copy of the widest
  phrase sits in flow; the first guess is by grapheme count
  (`resolveWidestPhrase`), and every phrase also measures on a wide invisible
  `probe` stage — wide so none is clamped to the slot it is sizing — which settles
  the real widest after one layout. `reserve="current"` fits each phrase instead,
  for a word that ends a line.
- **`Counting` reserves the longer of its start and its target.** The input does
  not re-measure as its native text changes, so an invisible `Text` in flow holds
  the width, and the input is laid absolutely over it. A tween is monotonic, so no
  in-flight value is longer than both ends.

## The numbers

- **`formatNumber` is a worklet and never touches `Intl`.** Hermes worklets have
  no `Intl`, so grouping and decimals are hand-written. Rounding is `toFixed`'s,
  half-cases included. A negative takes a true minus (U+2212) ahead of the prefix
  (`−$5`); one that rounds to zero takes no sign. `NaN` and the infinities are an
  em dash.
- **`Counting` writes digits through an animated `text` prop on a read-only
  `TextInput`.** No React render per frame. The input is `editable={false}`,
  `pointerEvents="none"`, zero padding and margin, with the `Text` classes.
- **A new `value` retargets from what is on screen.** `withTiming` starts from the
  shared value's current position, never from `from`; `from` is only the first
  mount's start, and `animateOnMount={false}` skips even that.
- **`Rolling`'s position is cumulative, so 9 → 0 rolls forward.**
  `resolveRollTarget` steps the shortest way in the value's direction — 9 → 10 on
  the way up, 0 → −1 on the way down — and a wheel's strip is `0…9` then a trailing
  `0`, which is what a position of 9.5 shows half of.
- **Wheels are keyed by their place from the right.** 999 → 1000 keeps three
  wheels and mounts a fourth, which rolls up from 0. Least-significant first,
  `stagger` ms apart. Separators, sign, prefix and suffix are static cells.
- **The wheel height is measured, never fixed.** One hidden digit reports the line
  height every wheel offsets by, so the odometer follows font scaling. Until it
  has, the strips are hidden.
- **Both numeric parts set `tabular-nums`.** No digit is wider than another, so a
  roll or a count never jitters sideways.

## Calm motion and interruption

Every part ends on the real final text. The animation is garnish on a fact.

| Part | Under `useCalmMotion()` |
| --- | --- |
| Reveal | Every unit at rest on the first frame; `onFinished` still fires once |
| Typing | The last phrase, typed in full, caret solid |
| Rotating | The first phrase, held — a rotating word is a loop |
| Counting | `value` at once, no tween — the value is information |
| Rolling | Every wheel at its digit at once |

An interrupted run lands on the new text: Reveal and Typing replay from the start
of the new text, a new phrase list resets `Rotating` to its first phrase, and a new
`value` retargets a count or a roll from where it is.

## What a screen reader gets

- **The final plain text, once.** The container is `accessible` with
  `accessibilityRole="text"` and a label of the final string — the whole text
  for Reveal, the last phrase for Typing, the current phrase for Rotating, the
  **formatted target** for Counting and Rolling. Every unit, cell, caret, wheel,
  layer and measuring copy is hidden beneath it. Without that, Rolling reads
  "0 0 0 0 1 2 3" mid-roll and Typing speaks every keystroke.
- **No live region.** Rotating and Counting do not announce a change — a reader
  chattering every two seconds is hostile. There is no `announce` prop in v1.

## Private splitting

`splitText` and `splitGraphemes` are a private copy of the contract `ScrollText`
also keeps (`TextUnit = { text, isSpace }`). Hermes ships no `Intl.Segmenter`, so
graphemes are hand-split: combining marks, skin tones, variation selectors, ZWJ
sequences, flag pairs, tag flags and CR LF. Hoisting both copies into `src/lib/` is
a follow-up after the media components merge, not something to do on this branch.

## Spikes, not yet verified on a device

- **Counting's `TextInput` metrics against `Text`.** Android font padding and line
  height can differ. If they do, rebuild `Counting` on `Rolling`'s wheels with
  `stagger={0}`; the public API does not change.
- **`tabular-nums` through Uniwind.** `Textarea`'s count already relies on it; if a
  face ignores it, set `fontVariant: ["tabular-nums"]` as a single style instead.
- **A 1000-character Reveal at 60 fps** on a mid-tier device.

## Preview media — a follow-up

No demo carries `meta.capture` yet: `demos.test.ts` requires a manifest entry and
both themes' media for every captured demo, and those come only from
`bun run previews`, which the lead runs after the media components merge. When it
does, capture `reveal-words` (`hero`, `align: "stretch"`), `reveal-characters`,
`typing` (`align: "stretch"`), `rotating`, `counting` and `rolling` — every one a
clip, since each is motion; `counting` and `rolling` need a flow that taps their
`-next` button. `orders` stays gallery-only.
