# AnimatedBadge

A status pill whose content moves when it changes: the old glyph and label roll
out, the new ones roll in, and the capsule springs to the new width. One paint,
one job, a small closed API.

`import { AnimatedBadge } from "@delacour/react-native-ui/animated-badge";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/animated-badge` (component, props, statuses, sizes, resolvers) |
| `animated-badge.tsx` | The root — builds the frame, owns the width spring and the layout transition |
| `animated-badge-content.tsx` | The moving glyph + label unit (internal leaf, `DelacourUI.AnimatedBadge.Content`) |
| `animated-badge-glyph.tsx` | Status → glyph map, the spinner for `loading`, the pulse (internal leaf, `…Glyph`) |
| `animated-badge-measure.tsx` | The invisible measurer that lays out the incoming content (internal leaf, `…Measure`) |
| `use-animated-badge-roll.ts` | The roll: holds the outgoing frame until it is off-screen, then lands the newest |
| `animated-badge.types.ts` | `AnimatedBadgeFrame`, shared by the root, the roll, the content and the measurer |
| `animated-badge.variants.ts` | Statuses, sizes, status → colour, constants, pure resolvers — no RN imports |
| `animated-badge.variants.test.ts` | Written first |

## Design

- **Not a `Badge`, and not a mode of one.** `Badge` is a static label with four
  paints, six colours and composed content. This is one paint and one job — say a
  status, and move when it changes. Folding a roll into `Badge` would put a
  measurer and two springs under every tag in a list that never changes.
- **No compound parts.** The roll has to own the glyph and the label together as
  one moving unit, so an `AnimatedBadge.Label` would only invite a child the roll
  cannot see. A caller wanting composed content uses `Badge`.
- **No `onPress`.** A status pill reports; it has no action. The root is a plain
  `Animated.View` with `accessibilityRole="text"`. A tappable status is a `Badge`
  with `onPress`, which already brings `Pressable`, feedback and haptics.
- **One paint: `Badge`'s soft row, read rather than restated.**
  `resolveAnimatedBadgeSlots` calls `badgeVariants({ variant: "soft", color, size })`
  from `../badge/badge.variants` — a leaf, legal across folders (package rule 3);
  never `../badge`. A test asserts the root, label and icon slots equal `Badge`'s
  at every status and size, so the two sit level in a row. No ring: the soft
  badge's reserved border stays transparent.
- **`status` maps to a `BadgeColor`, and `neutral` and `loading` share the
  neutral fill.** `destructive`, never `danger`. Work in flight has no verdict
  yet; the spinner already says it is moving. The glyph's colour is
  `BADGE_FOREGROUND_TOKEN.soft[color]`, the token the label resolves to, pinned by
  a test and checked against both themes.
- **Sizes are `sm` and `md` only.** A status pill sits in a list row, a header or
  a sentence; `lg` is a banner's size, and that is `Alert`.
- **Glyphs match `Alert`'s** for the four statuses both have: `IconCircleInfo`,
  `IconCircleCheck`, `IconExclamationTriangle` (warning) and
  `IconExclamationCircle` (destructive) — triangle against circle, so the two
  read apart without colour. `neutral` is a bare `IconCircle`. `loading` is a
  `Spinner`, sized and coloured by the same `IconDefaultsProvider` as an icon.
- **A custom `icon` beats the status's glyph, `loading` included.** It is the
  caller's explicit word. `showIcon={false}` draws nothing; the two are a
  discriminated union so `icon` with `showIcon={false}` does not typecheck.
- **`icon` takes an `IconComponent`, not a node.** The badge renders it through
  `<Icon>`, so its size and colour come from the badge — icons inherit, never
  hand-sized.
- **The roll is one view, never two copies.** `useAnimatedBadgeRoll` holds the
  frame on screen while the exit runs (`ROLL_OUT_MS`, toward `-ROLL_DISTANCE`,
  fading out). The swap happens from the exit's completion callback via
  `scheduleOnRN`, while the content is invisible; the enter springs in from
  `+ROLL_DISTANCE` in a layout effect after that commit, so it never starts on the
  outgoing word. Two overlapping copies double up mid-swap, which is the failure
  this shape exists to prevent.
- **A change mid-roll retargets.** The exit continues from where it is, and
  whichever frame is newest when it finishes lands — intermediates are skipped. A
  change back to the frame still on screen returns it home instead of rolling.
  The effect is keyed on the two keys, not on the frame object, so a parent
  re-rendering mid-exit does not restart the exit's clock.
- **The capsule paints from the frame on screen**, not from the incoming props.
  Its fill changes while the outgoing word is invisible, rather than under it, and
  the outgoing word keeps its own colour on its way out.
- **The width spring measures the next content before it arrives.**
  `AnimatedBadgeMeasure` is a copy of the capsule — the root's classes, the row,
  the one-line label — on an absolutely positioned, transparent,
  `pointerEvents="none"`, hidden-from-assistive-technology canvas. Its `onLayout`
  drives the root's `width` with `withSpring`. The canvas is
  `MEASURE_CANVAS_WIDTH` wide because Yoga caps an absolute child's available
  width at its parent's: without it a narrow badge would wrap the next word and
  report the wrapped width. The glyph is measured as a box of the icon step — a
  spinner in the measurer would spin for nobody.
- **The first paint never jumps.** The root carries no width until the first
  measure, and that first measure is set without a spring.
- **A text label is drawn on one line** (`numberOfLines={1}`) — the measurer lays
  it out on one line too, so the measured width is the width drawn. A status is
  a word or two; a sentence belongs in an `Alert`.
- **Padding, never a height** — `Badge`'s rule and reason: OS font scaling.
- **`animateLayout`** puts `LinearTransition.springify()` on the root, so the
  badge springs to a new position when the layout around it moves. Inside
  flowing text that would slide the badge across lines when the sentence
  reflows, so `animateLayout={false}` turns it off.
- **Change detection is a string key.** `resolveAnimatedBadgeKey`:
  `contentKey` wins (`status:contentKey`), then text children — a string, a
  number, or an array of only those (`status:joined`) — then the status alone. A
  non-text label therefore rolls only on a status change unless it is given a
  `contentKey`. The same key across a re-render does nothing.
- **Reduce motion cuts over; calm motion stills only the pulse.**
  `resolveAnimatedBadgeMotion` returns `{ roll, resize, layout, pulse }`. Under
  `useReducedMotion()` the content swaps, the width is set, no layout transition
  runs and nothing pulses. Under the app's `isMotionCalm` alone (E2E) the roll
  and springs still run — they settle, which is all a test runner waits for —
  and only the endless pulse holds still.
- **The pulse is on the glyph, not the capsule.** A swelling capsule pushes the
  layout around it and reads as noise; a swelling glyph reads as breathing. It
  defaults on for `loading`, and an explicit `pulse={false}` wins. Its repeat
  sets `ReduceMotion.Never` and is gated one level up, exactly like
  `useSkeletonClock` — under the default policy a `withRepeat(-1)` of a
  zero-length timing spins forever.
- **Accessibility.** The root is `accessible`, `accessibilityRole="text"`,
  labelled with the label text (a caller's `accessibilityLabel` wins) and
  `accessibilityState.busy` while `loading`. The glyph is hidden — it duplicates
  the word — and so is the measurer. With `announce` (default `true`) the root
  is a polite live region on Android, and iOS calls
  `AccessibilityInfo.announceForAccessibility` once the new content lands, never
  on mount. Pass `announce={false}` in a list of fifty, where every row
  announcing is noise.

## Where the spec and the icon set disagreed

- The usage examples name a sparkles glyph; Central has `IconSparkle`, singular.
  The demos and docs use `IconSparkle`.
- The spec's file map has no measurer, roll hook or types file. Each exists
  because the root, the content and the measurer all need the frame, and a part
  must never import its own root (package rule 3).
