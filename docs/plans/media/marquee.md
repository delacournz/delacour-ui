# Marquee — design spec

Plan ID `media-marquee`. Single phase `media-marquee-1`. Issue title: `Marquee 1 - ✨ feat:`.

## 1. Purpose on mobile

Content that travels across its container on a loop: a strip of badges, a wall of logos, a ticker of
quotes, two rows drifting opposite ways. Horizontal or vertical, any children, constant speed in
points per second, held still on touch, and held still for good under calm motion.

- **It is decoration, so it must be able to stop.** A loop that never ends is the single worst case
  for a UI test runner that waits for the screen to idle (see `calmMotion`) and for a reader with
  reduce-motion on. Both get a static, scrollable strip instead — content stays reachable.
- **It is not a carousel.** No snapping, no index, no paging. Anything the user must reach by swiping
  is `Tabs`' pager territory.

## 2. Public API

`import { Marquee } from "@delacour/react-native-ui/marquee";`

```tsx
<Marquee speed={40} gap="md" pauseOnPress>
  <Badge>…</Badge><Badge>…</Badge>
</Marquee>

<Marquee.Group speed={30}>
  <Marquee direction="left">…</Marquee>
  <Marquee direction="right">…</Marquee>
</Marquee.Group>
```

```ts
export const MARQUEE_DIRECTIONS = ["left", "right", "up", "down"] as const;
export type MarqueeDirection = (typeof MARQUEE_DIRECTIONS)[number];
export const MARQUEE_GAPS = ["none", "xs", "sm", "md", "lg", "xl"] as const;
export type MarqueeGap = (typeof MARQUEE_GAPS)[number];
export type MarqueeAxis = "horizontal" | "vertical";

export type MarqueeFade =
  | { kind: "none" }
  | { kind: "edges"; size?: number; color?: MarqueeFadeColor }; // size in pt, default 24

/** Theme tokens a fade can blend into; must equal the surface the marquee sits on. */
export type MarqueeFadeColor = "background" | "card" | "muted" | "elevated";

export type MarqueePause =
  | { kind: "none" }
  | { kind: "press" }                  // held while a finger is down on it
  | { kind: "controlled"; isPaused: boolean };

export type MarqueeProps = Omit<ViewProps, "children"> & {
  children: ReactNode;
  direction?: MarqueeDirection;        // default "left"
  /** Points per second. Positive; sign comes from `direction`. Default 40. */
  speed?: number;
  gap?: MarqueeGap;                    // default "md" — trailing gap inside each copy
  fade?: MarqueeFade;                  // default { kind: "none" }
  pause?: MarqueePause;                // default { kind: "press" }
  /** Ease between moving and held, ms. Default 250. 0 = instant. */
  easeMs?: number;
  accessibilityLabel?: string;         // read once, from the container
  className?: string;
  contentClassName?: string;           // the row/column wrapping each copy
};

export type MarqueeGroupProps = ViewProps & {
  speed?: number;                      // inherited by each Marquee that sets none
  pause?: MarqueePause;                // one pause for the whole group
  className?: string;
};

export const Marquee = Object.assign(MarqueeRoot, {
  /** Holds one pause state and a default speed for every strip inside it. */
  Group: MarqueeGroup,
  displayName: "DelacourUI.Marquee",
});
export function useMarqueeGroup(): MarqueeGroupContextValue | null;
```

`direction` encodes axis and sign in one value — a separate `orientation` plus `reverse` pair has an
illegal state (`orientation="vertical" reverse` meaning what?). `resolveMarqueeAxis` derives the axis.

## 3. File map

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/marquee` (root, prop types, constants, `useMarqueeGroup`, variants) |
| `marquee.tsx` | `MarqueeRoot` (function declaration) + `Object.assign` surface |
| `marquee-group.tsx` | `Marquee.Group` — shared pause + default speed |
| `marquee-track.tsx` | Internal leaf: the UI-thread integrator and the translated strip of copies |
| `marquee-scroller.tsx` | Internal leaf: the still, hand-scrollable fallback under calm motion |
| `marquee-fade.tsx` | Internal leaf: the two edge gradients (react-native-svg) |
| `marquee.context.tsx` | `MarqueeGroupProvider`, `useMarqueeGroup()` — imports React only |
| `marquee.types.ts` | Prop types shared by two or more files |
| `marquee.variants.ts` | Slotted `tv()` + every pure resolver below, no RN imports |
| `marquee.variants.test.ts` | |
| `AGENTS.md` | Design decisions + this file map |

Every file's component takes `DelacourUI.Marquee[.Part]` (`.Track`, `.Scroller`, `.Fade`, `.Group.Provider`).

## 4. Variants & sizes

Not a sized control, so no `size` axis. Axes: `direction` (axis + sign), `gap` (spacing tokens
`gap-*` applied as trailing padding: `pr-*` horizontal / `pb-*` vertical, **never** a `gap-*` between
copies — see §7), `fade`. `marquee.variants.ts` slots: `root` (`overflow-hidden`), `track`
(`flex-row` | `flex-col`), `copy` (axis + trailing gap), `fade`. Compound variants set the trailing
side per axis. The root is `overflow-hidden`; a vertical marquee needs a bounded height from the
caller's `className` (`h-40`) and documents it, because a column of unbounded height has nothing to clip.

## 5. States

| State | What it looks like |
| --- | --- |
| unmeasured | First frame: copy 1 only, translate 0, opacity 0 until `onLayout` resolves the period, then 1. No jump. |
| playing | Integrator advancing at `velocity` |
| easing | Velocity tweening to/from 0 over `easeMs` on pause/resume — a held strip decelerates rather than freezing mid-frame |
| paused | `pause` says so (finger down, or `controlled.isPaused`) |
| calm | `useCalmMotion()` true → `MarqueeScroller`: one copy, `horizontal`/vertical `ScrollView`, `showsScrollIndicator={false}`, no duplicates. Re-evaluated live if the OS setting flips. |
| content shorter than container | Still loops (copies fill), unless `period <= 0` — then calm layout. A strip with nothing to scroll is a bug the caller can see. |

## 6. Accessibility

- **Duplicates are hidden, copy 1 is the content.** Copies 2..n get
  `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android).
  Without it VoiceOver reads every badge three times and the user thinks the list has 30 items.
- **Copy 1 stays focusable even while it slides.** A reader must be able to swipe through a moving
  strip; swiping focus scrolls nothing, since the view is translated rather than scrolled.
- **`accessibilityLabel` on the root is optional and replaces nothing** — children keep their own
  semantics; the label is for purely decorative content (a logo wall) where the caller prefers one
  sentence ("Trusted by …"). When set, the root is `accessible` and children are hidden too.
- **Reduce motion (OS) or `isMotionCalm`** → §5 calm layout. The strip is still scrollable by hand;
  nothing is lost.
- **Never auto-pause on screen-reader focus alone** (no cross-platform signal); `pause: press` plus calm
  fallback is the contract.

## 7. Motion

- **A frame-callback integrator, not `withRepeat`.** `useFrameCallback` adds `dt * velocity` to an
  `offset` shared value and wraps it by `period`. `withRepeat(withTiming(...))` cannot resume from
  mid-loop after a pause — it restarts, snapping the strip — and cannot change speed without a seam.
  The integrator pauses, resumes and re-speeds with zero jump. `dt` comes from the frame info and is
  clamped (`MARQUEE_MAX_FRAME_MS = 64`) so a backgrounded app does not teleport the strip.
- **Speed is points per second, never a duration.** A duration makes a 3-badge strip crawl and a
  30-badge strip fly. `resolveMarqueeDuration(period, speed)` exists only to report one loop's length
  (docs, tests, a11y hints) — it never drives the animation.
- **The period is the measured size of one copy, trailing gap included.** Each copy carries its gap as
  trailing padding and `onLayout` reports that padded size. A `gap-*` *between* copies would leave the
  last copy's gap uncounted and the loop would jump by one gap on every wrap.
- **Copy count fills the container plus one period.** `resolveMarqueeCopies(container, period)` =
  `ceil(container / period) + 1`, minimum 2, capped at `MARQUEE_MAX_COPIES` (12) so a one-pixel child
  does not mount a thousand. Copies re-resolve on either `onLayout`.
- **The wrap is invisible because the strip is periodic.** Translation = `-(offset mod period)` for
  left/up, `-(period - offset mod period)` for right/down. At `offset = period` the picture equals
  `offset = 0`; a test asserts exact equality of `resolveMarqueeTranslation(p)` and `(0)`.
- **Pause is velocity easing**, `withTiming(0, { duration: easeMs })` into a `velocity` shared value
  — the integrator reads it every frame. `pause: press` uses a Gesture Handler `LongPress` with
  `minDuration(0)`, `shouldCancelWhenOutside(false)` and `simultaneousWithExternalGesture` so a child
  `Pressable` still receives its tap while the strip holds. It lives on `DelacourProvider`'s gesture root.
- **Group** keeps one `isPaused` shared value and a default `speed`; strips inside read it, so a press
  on any row stills every row. Opposite directions are just two signs of one speed — rows stay in
  proportion.
- No React state on the hot path. Only the copy count is state, and it changes on layout, not per frame.

## 8. Reuses

`Pressable` is **not** used (it would swallow children's presses). Reuses: `useCalmMotion`,
`useThemeColor` (fade colour), `cn`, `tv` from `lib/tv`, `Text`/`Badge` as demo content, the SVG gradient
technique from `skeleton-shimmer.tsx` (copy the idea, not an import — it is a private leaf), Gesture
Handler (already a peer).

## 9. Dependencies

None new. `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `react-native`
are existing peers and already in `PACKAGE_INSTALL` (`expo`). Verify `react-native-worklets` is listed
if `scheduleOnRN` is used (it should not be needed here). `ITEM_META.marquee`:
`{ title: "Marquee", description: "Content that travels across its container on a loop, held still on touch.", categories: ["display"] }`.

## 10. Sibling / cross-category dependencies

- **Imports no sibling.** Not `text-animation`, `scroll-text` or `circular-text`. Fully parallel, no wave.
- Shares an *idea* with `circular-text` (frame-callback integrator, pausable, speed in units/s). Each
  keeps its own private integrator; a shared `lib/` hook is a post-merge refactor, not a prerequisite.
- Cross-category: none missing. Gesture root and svg exist. A `Fade` edge-gradient utility would also
  serve `Screen.ScrollShadow`; out of scope, noted.

## 11. Pure logic to unit-test (TDD — write these first)

```ts
resolveMarqueeAxis(direction: MarqueeDirection): MarqueeAxis
resolveMarqueeSign(direction: MarqueeDirection): 1 | -1          // left/up = -1 translate
resolveMarqueeVelocity(direction, speed: number): number          // signed pt/s; speed <= 0 -> 0
resolveMarqueeDuration(period: number, speed: number): number     // ms for one loop; speed 0 -> Infinity
resolveMarqueeCopies(container: number, period: number): number
advanceMarqueeOffset(offset: number, dtMs: number, velocity: number, period: number): number
resolveMarqueeTranslation(offset: number, period: number, direction: MarqueeDirection): number
clampFrameDelta(dtMs: number): number
resolveMarqueeFade(fade: MarqueeFade): { size: number; color: MarqueeFadeColor } | null
```

Cases: `resolveMarqueeDuration(400, 40) === 10000`; `resolveMarqueeCopies(390, 120) === 5`;
`(390, 500) === 2`; `(390, 0)` → 1 (unmeasured); `(390, 0.5)` → 12 (cap).
`advanceMarqueeOffset(390, 1000, 40, 400)` wraps to 30; negative velocity wraps from 0 to period - x;
`dt = 0` is identity; `period = 0` returns 0 (no NaN). Translation at `offset = 0` and `offset = period`
are equal for all four directions. `clampFrameDelta(5000) === 64`. Variant tests assert horizontal
`copy` carries `pr-*`, vertical `pb-*`, and never `gap-*`. `display-name.test.ts` + `docs.test.ts`
cover the rest.

## 12. Playground demos

`apps/playground/src/demos/marquee/` — all `testID`d, imports from the library only.

| File | Shows | Capture |
| --- | --- | --- |
| `badges.tsx` | A strip of `Badge`s drifting left with edge fades — **`hero`** | clip |
| `two-rows.tsx` | Two strips in a `Marquee.Group`, opposite directions, one pause | clip |
| `vertical.tsx` | A `h-48` column of notices travelling up | clip |
| `hold-to-pause.tsx` | `pause: press`; flow long-presses mid-strip, then releases | clip (flow) |
| `speed.tsx` | Three speeds (20 / 60 / 120 pt/s) stacked: speed is points not duration | clip |
| `cards.tsx` | Tappable `Item`/`Card` content — a child press still fires while moving | gallery only |

Route `apps/playground/src/app/(components)/marquee.tsx` (six-line `DemoGallery`), row in
`src/app/index.tsx`. Clips need `meta.capture.flow` under `.argent/flows/previews/`.

## 13. Docs page

`apps/web/content/docs/native/components/marquee.mdx` — frontmatter `title`, `description`, `icon`.
Outline: `<Preview id="marquee/badges" title={null} />` · Installation (`<ComponentInstall name="marquee" />`) ·
Usage · Anatomy (`Marquee`, `Marquee.Group`) · Direction · Speed (points per second, why) · Edge fades ·
Pausing (press, controlled) · Rows in step (Group) · Reduced motion (what you get) · Accessibility ·
API reference (both parts). `meta.json`: add `"marquee"` after `"text"` in **Data Display** (lead merges
the four siblings' lines once).

## 14. Acceptance checklist

- [ ] `marquee.variants.test.ts` written first, red, then green (`bun test packages/react-native-ui/src/components/marquee`)
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; no comments in JSX
- [ ] `displayName` on root, `Group`, provider, `Track`, `Scroller`, `Fade`
- [ ] `AGENTS.md` in the folder + row in `packages/react-native-ui/AGENTS.md` **Components** table
- [ ] `bun run gen-exports`
- [ ] demos listed in `index.ts`, `bun run gen-demos`, route file + `src/app/index.tsx` row
- [ ] docs page + `meta.json`
- [ ] `ITEM_META.marquee`; `bun --filter delacour run registry:build`; `verify:expo` passes
- [ ] `bun run changeset` (minor, `@delacour/react-native-ui`)
- [ ] Simulator check: lease via `warden claim ios --json`, drive with `agent-device`, `close` + `warden release`
- [ ] Calm motion verified: OS Reduce Motion on and `isMotionCalm` build → scrollable still strip, no duplicates in the a11y tree
- [ ] Loop seam invisible over 5 full wraps at 20 / 120 pt/s (record clip, step frames)
- [ ] Pause/resume produces no positional jump; speed change mid-flight has no jump
- [ ] A child `Pressable` fires while the strip moves and while held
- [ ] VoiceOver / TalkBack read each item once
- [ ] Vertical strip with no bounded height documented, not crashing
- [ ] Rotating the device re-resolves copy count (no gap at the trailing edge)
