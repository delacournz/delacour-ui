# AnimatedBadge — design spec

Phase `FB-1` of plan `FEEDBACK-2026-10`. Folder `packages/react-native-ui/src/components/animated-badge/`,
import `@delacour/react-native-ui/animated-badge`.

## Purpose

A status pill whose content **moves** when it changes. A badge that swaps "Building" for "Live"
between one frame and the next is a badge people miss; one whose old word slides out, whose new
word slides in and whose capsule springs to the new width is one they see. On mobile it sits in a
list row (a deploy, an order, a sync), in a header beside a title, or inline in a sentence.

It is **not** a replacement for `Badge`. `Badge` is a static label with four paint variants, six
colours and composed content. `AnimatedBadge` is one paint (soft), one job (say a status and
animate when it changes), and a small closed API. Keep them separate components; share paint.

## API

```tsx
import { AnimatedBadge } from "@delacour/react-native-ui/animated-badge";

<AnimatedBadge status={job.status}>{job.label}</AnimatedBadge>
<AnimatedBadge status="info" icon={IconSparkles}>Suggested</AnimatedBadge>
<AnimatedBadge status="warning" showIcon={false}>Draft</AnimatedBadge>
<AnimatedBadge size="sm" status="info" animateLayout={false}>{`${n} reviews`}</AnimatedBadge>
```

```ts
export const ANIMATED_BADGE_STATUSES = ["neutral", "info", "success", "warning", "destructive", "loading"] as const;
export type AnimatedBadgeStatus = (typeof ANIMATED_BADGE_STATUSES)[number];

export const ANIMATED_BADGE_SIZES = ["sm", "md"] as const;
export type AnimatedBadgeSize = (typeof ANIMATED_BADGE_SIZES)[number];

/** Glyph control as a discriminated union — no `icon` + `showIcon={false}` contradiction. */
type AnimatedBadgeGlyphProps =
	| { showIcon?: true; icon?: IconComponent }   // default glyph for the status, or a custom one
	| { showIcon: false; icon?: never };

export type AnimatedBadgeProps = Omit<ViewProps, "children"> & AnimatedBadgeGlyphProps & {
	/** What the badge says. Default `neutral`. */
	status?: AnimatedBadgeStatus;
	/** `sm` for a list row or a sentence, `md` standalone. Default `md`. */
	size?: AnimatedBadgeSize;
	/** The label. A string (or number) is what change detection keys on. */
	children: ReactNode;
	/**
	 * Explicit change key. Required in practice when `children` is not a string/number, or when
	 * the same words must re-roll (e.g. a counter that resets). Without it, a non-text label
	 * rolls only when `status` changes.
	 */
	contentKey?: string | number;
	/** A gentle repeating swell. Defaults to `true` when `status` is `loading`. Stilled by calm motion. */
	pulse?: boolean;
	/**
	 * Spring to a new position when surrounding layout moves. Default `true`. Turn off inside
	 * flowing text, or the badge slides across lines when the sentence reflows.
	 */
	animateLayout?: boolean;
	/** Announce a change to assistive technology. Default `true`. */
	announce?: boolean;
	labelClassName?: string;
	className?: string;
};
```

`icon` takes an `IconComponent` (the Central Icons component type `Icon` takes), **not** a
`ReactNode` — the badge renders it through `<Icon>` so its size and colour come from the badge.
That is the house rule (icons inherit, never hand-sized). A caller wanting arbitrary content uses
`Badge`.

No compound parts. The roll needs to own the label and the glyph together as one moving unit, so
exposing `AnimatedBadge.Label` would only invite a child the roll cannot see. State that refusal
in the folder's `AGENTS.md`. It still exports a `displayName` (`DelacourUI.AnimatedBadge`) and
every internal leaf gets one (`DelacourUI.AnimatedBadge.Content`, `…Measure`).

## Paint

- **One paint: the soft row of `Badge`'s matrix.** Import `badgeVariants` and
  `BADGE_FOREGROUND_TOKEN` from `../badge/badge.variants` — a **leaf**, legal across folders
  (package rule 3). Never import `../badge`.
- `status → BadgeColor` map, pure, in `animated-badge.variants.ts`:
  `neutral → default`, `info → info`, `success → success`, `warning → warning`,
  `destructive → destructive`, `loading → default`. Use `destructive`, never `danger` (token rule).
- **No outline ring.** Tinted fill only. A soft badge's reserved transparent border is fine;
  nothing paints it.
- Sizes: `sm` and `md` reuse `Badge`'s `sm`/`md` padding, type and icon step verbatim (read from
  `badgeVariants({ size })`), so an `AnimatedBadge` and a `Badge` of the same size sit level. A
  test asserts the root slot classes match `Badge`'s at each size.
- Padding, never a height (Badge's rule, same reason — font scaling).

## Glyphs

| Status | Glyph |
| --- | --- |
| `neutral` | `IconCircle` (or the nearest Central neutral dot) |
| `info` | `IconCircleInfo` |
| `success` | `IconCircleCheck` |
| `warning` | `IconExclamationTriangle` |
| `destructive` | `IconExclamationCircle` |
| `loading` | `Spinner` at the badge's icon step, coloured by the same foreground token |

Match `Alert`'s glyph choices for the four shared statuses (shape differs between warning and
destructive for colour-blind readers). The glyph map lives in a `.tsx` (it holds SVG components);
`animated-badge.variants.ts` holds only the status list and a `resolveAnimatedBadgeGlyphKind`
returning `"spinner" | "icon" | "none"` from `{ status, showIcon, hasCustomIcon }` — pure, tested.
Verify each Central icon name exists in `src/icons/central.ts` before using it.

## Motion

All three motions run on the UI thread with Reanimated. Nothing re-renders to animate.

1. **Roll (content).** One `Animated.View` holds glyph + label. On a change: animate it out
   (`translateX` toward −`ROLL_DISTANCE`, opacity → 0, `ROLL_OUT_MS`), **swap the rendered content
   while it is off-screen**, then in from +`ROLL_DISTANCE` (opacity → 1, spring). Single view
   throughout — never two overlapping copies, which double up mid-swap.
   Implementation shape: keep `displayed` (the content currently drawn) in state; when the
   incoming key differs, run the exit, and from the exit's completion callback
   (`scheduleOnRN`) set `displayed` to the incoming content, then run the enter. A change that
   arrives mid-roll retargets: the latest content wins, intermediates are skipped.
2. **Width spring.** The capsule springs to the new content's width. Measure the incoming content
   in an invisible, absolutely positioned, `pointerEvents="none"` measurer
   (`importantForAccessibility="no-hide-descendants"`, `accessibilityElementsHidden`) rendered
   with the *next* content; drive the root's `width` with `withSpring` from its `onLayout`. Before
   the first measure the root is content-sized (no fixed width), so the first paint never jumps.
3. **Position spring.** `animateLayout` → `layout={LinearTransition.springify()}` on the root.
   `false` → no layout transition.

**Pulse.** When `pulse` (default `status === "loading"`): a slow scale/opacity swell on the glyph
(or the capsule — pick on the simulator; the glyph reads less noisy), looping. It is decorative:
gate it with `useCalmMotion()` so reduce-motion and the app's `isMotionCalm` both hold it still.
Use `ReduceMotion.Never` on the repeat itself and gate one level up, exactly like
`useSkeletonClock` — under the default policy a `withRepeat(-1)` of a zero-length timing spins
forever.

**Reduced motion.** The roll and the width spring are not loops, but under `useReducedMotion()`
they **cut over**: content swaps immediately, width is set without a spring, no layout
transition. Under `isMotionCalm` alone (E2E), keep them — they are finite and settle.
`resolveAnimatedBadgeMotion({ isReduceMotion, isMotionCalm, pulse, status, animateLayout })`
returns `{ roll: boolean; resize: "spring" | "instant"; layout: boolean; pulse: boolean }` — pure, tested.

Constants (`ROLL_DISTANCE`, `ROLL_OUT_MS`, spring configs, `PULSE_CYCLE_MS`) live in
`animated-badge.variants.ts` and are pinned by tests (exit shorter than ~200 ms; roll distance
small — a few points, not the capsule width).

## Change detection

`resolveAnimatedBadgeKey({ status, children, contentKey })`:

- `contentKey` set → `` `${status}:${contentKey}` ``
- `children` a string/number, or an array of only strings/numbers → `` `${status}:${joined}` ``
- otherwise → `status` (a non-text label rolls only on a status change)

A change in the key triggers a roll. Same key → no motion, even if the parent re-renders. Pure, tested.

## Accessibility

- Root is a plain `View` (not pressable — a status pill has no action; refuse `onPress` and say
  why in `AGENTS.md`: a tappable status should be a `Badge` with `onPress`).
- `accessible`, `accessibilityRole="text"`, `accessibilityLabel` = the label text when it is a
  string (caller's `accessibilityLabel` wins), `accessibilityState={{ busy: status === "loading" }}`.
- Glyph hidden from assistive technology — it duplicates the word.
- **Announce changes.** When the key changes and `announce`: Android
  `accessibilityLiveRegion="polite"` on the root; iOS
  `AccessibilityInfo.announceForAccessibility(label)` once the new content lands (not on mount).
  `announce={false}` for a badge in a list of fifty, where every row announcing is noise.
- The measurer is hidden from assistive technology and takes no touches.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/animated-badge` (component, props, statuses, sizes, resolvers) |
| `animated-badge.tsx` | The root |
| `animated-badge-content.tsx` | The moving glyph + label unit (internal leaf) |
| `animated-badge-glyph.tsx` | Status → glyph map, spinner for `loading` (internal leaf) |
| `animated-badge.variants.ts` | Statuses, sizes, status→colour map, constants, pure resolvers — no RN imports |
| `animated-badge.variants.test.ts` | Written first |
| `AGENTS.md` | Design decisions, file map |

## Pure logic to test first (`animated-badge.variants.test.ts`)

- Status → `BadgeColor` map is total and uses `destructive`.
- Foreground token for each status equals `BADGE_FOREGROUND_TOKEN.soft[color]`, and that token is
  declared in both themes of `theme.css` (reuse the existing theme-token reader).
- Root/label/icon classes per size equal `badgeVariants({ variant: "soft", color, size })`'s.
- No `h-*` on the root at any size.
- `resolveAnimatedBadgeKey` — all three branches, arrays of strings, numbers, `contentKey` wins.
- `resolveAnimatedBadgeGlyphKind` — loading → spinner, `showIcon: false` → none, custom icon → icon.
- `resolveAnimatedBadgeMotion` — reduce-motion cuts roll/resize/layout/pulse; calm alone stills
  pulse only; `pulse` defaults from status; explicit `pulse={false}` on loading wins.
- Constants in range.

## Playground demos (`apps/playground/src/demos/animated-badge/`)

Read `apps/playground/src/demos/AGENTS.md` first. Then `bun run gen-demos`.

1. `status-flow` (**hero**, capture) — a button stepping Queued → Building → Deploying → Live.
2. `statuses` (capture) — all six statuses, static.
3. `sizes` (capture) — `sm` / `md`.
4. `custom-icon` (capture) — custom glyph and `showIcon={false}`.
5. `inline-text` (capture) — badge in a wrapping sentence with `animateLayout={false}`; a control
   changes the count so the sentence reflows.
6. `reduced-motion` — documents the cut-over; not captured.

Route `apps/playground/src/app/(components)/animated-badge.tsx` (six-line `DemoGallery` shell) and
a row on `src/app/index.tsx`.

## Docs page

`apps/web/content/docs/native/components/animated-badge.mdx`, same shape as `badge.mdx`:
Preview hero, Installation (`<ComponentInstall name="animated-badge" />`), Usage, Statuses, Sizes,
Icons, Inside text (`animateLayout`), Change detection (`contentKey`), Motion and reduced motion,
Accessibility, Props table. Add to the folder's `meta.json` if pages are listed there.

## Registry and release

- `packages/cli/src/registry/config.ts` `ITEM_META.animated-badge` — title, description.
- `bun --filter delacour run registry:build`; commit `registry/`.
- Changeset: `minor` on `@delacour/react-native-ui` — "Add AnimatedBadge, a status pill that rolls
  its content and springs its width when the status changes."

## Acceptance checklist

- [ ] `animated-badge.variants.test.ts` written before the implementation and green.
- [ ] Single moving view; no doubled content visible at any frame of a roll (check slowed on simulator).
- [ ] Width springs to new content; first paint has no jump.
- [ ] Rapid successive changes settle on the latest content with no stuck intermediate.
- [ ] `animateLayout={false}` inside reflowing text does not slide across lines.
- [ ] Reduce motion: instant swap, instant resize, no pulse. `isMotionCalm`: no pulse, roll still runs.
- [ ] Loading shows a spinner; `accessibilityState.busy` true.
- [ ] VoiceOver reads the label once; a change is announced; glyph and measurer are silent.
- [ ] Every component and leaf has a `DelacourUI.` `displayName`.
- [ ] Folder `AGENTS.md`, package **Components** row, `gen-exports`, demos + `gen-demos`, docs page,
      registry entry, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
- [ ] Simulator verification via warden + agent-device, or its absence recorded in the commit body.
