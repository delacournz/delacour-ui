# FlipCard — design spec

Two faces of one card and a turn between them: a flashcard, a payment card with its number on the
back, a profile with details behind it. Compound root plus `FlipCard.Front`, `FlipCard.Back` and
`FlipCard.Trigger`. Folder `src/components/flip-card/`.

`import { FlipCard } from "@delacour/react-native-ui/flip-card";`

## 1. Purpose on mobile

- **A flip is a state change, not an animation.** The face is data (`"front" | "back"`), the
  rotation is derived from it. The failure this prevents is a card that is visually showing the
  back while assistive tech, focus and taps still belong to the front.
- **Phones flip by hand.** The two natural inputs are a tap and a swipe that follows the finger
  and settles on the nearer face. Both are first-class; neither is the default for an author who
  wanted the other, so `trigger` is explicit.
- **`backfaceVisibility` is not trusted.** It is unreliable on Android and drops with some
  transform stacks. Visibility is decided by the rotation angle and an opacity swap at 90°.
- **Not a carousel, not a Card.** One card, two faces. Faces wear `Surface`'s fill ladder so a
  flip card and a `Card` beside it read as one family; it adds no header/footer anatomy.

## 2. Public API

```ts
export const FLIP_CARD_FACES = ["front", "back"] as const;
export type FlipCardFace = (typeof FLIP_CARD_FACES)[number];

export const FLIP_CARD_AXES = ["x", "y"] as const;
/** The axis the card turns about: "y" swings it left/right, "x" tips it top/bottom. */
export type FlipCardAxis = (typeof FLIP_CARD_AXES)[number];

export const FLIP_CARD_TRIGGERS = ["press", "swipe", "manual"] as const;
export type FlipCardTrigger = (typeof FLIP_CARD_TRIGGERS)[number];

type FlipCardBaseProps = {
  /** Controlled face. Omit for uncontrolled. */
  face?: FlipCardFace;
  defaultFace?: FlipCardFace; // default "front"
  onFaceChange?: (face: FlipCardFace) => void; // fires when a turn is committed (start), not on settle
  onFlipEnd?: (face: FlipCardFace) => void;    // fires once the card has settled
  axis?: FlipCardAxis; // default "y"
  /** Camera distance in points, applied as the first transform. Default 1000. */
  perspective?: number;
  /** Spring/timing preset for the settle. Default "default". */
  motion?: "default" | "snappy" | "gentle";
  haptic?: false | HapticFeedback; // default "light"; plays when the card passes 90°
  isDisabled?: boolean;
  /** Spoken when the face changes. Defaults: "Front of card" / "Back of card". */
  faceLabels?: { front: string; back: string };
  accessibilityLabel?: string; // names the card as a whole
  className?: string;          // the card's footprint (front is in flow; back fills it)
  children: ReactNode;         // FlipCard.Front, FlipCard.Back, anything else
};

export type FlipCardProps =
  | (FlipCardBaseProps & { trigger?: "press" })
  | (FlipCardBaseProps & { trigger: "swipe"; /** Drag travel, in points, that equals a half turn. Default = card extent along the axis. */ swipeDistance?: number })
  | (FlipCardBaseProps & { trigger: "manual" });

export type FlipCardFaceProps = {
  /** Surface fill. Default: front "default", back "secondary". */
  variant?: SurfaceVariant;
  padding?: SurfacePadding; // default "md"
  className?: string;
  children?: ReactNode;
};

export type FlipCardTriggerProps = PressableProps & {
  /** Which face to go to. Omitted = toggle. */
  to?: FlipCardFace;
};

export type FlipCardHandle = { flip: () => void; flipTo: (face: FlipCardFace) => void };
// FlipCard accepts ref: Ref<FlipCardHandle>

export function useFlipCard(): { face: FlipCardFace; flip: () => void; flipTo: (face: FlipCardFace) => void; isFlipping: boolean };
```

- **`trigger` is a discriminated union**: `swipeDistance` exists only on `"swipe"`, so a caller
  cannot pass it to a card that ignores it.
- `"press"`: tap anywhere on the card toggles. `"swipe"`: pan scrubs the rotation; a tap does
  nothing. `"manual"`: no gesture on the root; only `face`, the ref, or a `FlipCard.Trigger`
  turn it. `FlipCard.Trigger` works under every trigger mode (a "Flip" button on a swipe card is
  the accessible alternative to dragging).
- Compound surface: `Object.assign(FlipCardRoot, { Front, Back, Trigger })`.

## 3. File map

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/flip-card` (+ tuples, types) |
| `flip-card.tsx` | Root: state, shared `rotation`, the gesture, the settle, the announcement |
| `flip-card-front.tsx` | In-flow face, rotated by `rotation` |
| `flip-card-back.tsx` | `absolute inset-0` face, pre-rotated 180 about the axis |
| `flip-card-face.tsx` | Internal shared body: `Surface`, animated style, a11y hiding (internal, not exported) |
| `flip-card-trigger.tsx` | `FlipCard.Trigger`, a `Pressable` calling `flipTo` |
| `flip-card.context.tsx` | `FlipCardContext`, `useFlipCard()`, `useFlipCardContext()`, `useFlipCardPart()` |
| `flip-card.types.ts` | Prop types shared by two or more parts |
| `flip-card.variants.ts` | Slotted `tv()`, motion presets, pure resolvers, no RN imports |
| `flip-card.variants.test.ts` | |
| `AGENTS.md` | Design decisions; Components-table row |

## 4. Variants & sizes

- **No `size` axis.** The card has no intrinsic scale; the author sets footprint with `className`
  (`aspect-[1.586]`, `h-48`). A size axis would be a second way to say that.
- **Face `variant`**: `Surface`'s four fills (`default`, `secondary`, `tertiary`, `transparent`).
  The back defaults to `secondary` so the two faces are distinguishable without the author asking —
  *and* the back must be opaque: a `transparent` back would show the front through it at the
  opacity swap's midpoint, so `FlipCard.Back` dev-warns on `transparent`.
- **`padding`** is `Surface`'s steps; `md` default.
- **`axis`**: `"y"` (default) and `"x"`. Axis picks `rotateY` vs `rotateX`, and the swipe axis
  (horizontal pan vs vertical pan).
- **`motion` presets**: `default` spring (damping 18, stiffness 160), `snappy` (damping 22,
  stiffness 260), `gentle` (damping 16, stiffness 90) — a constant table in `flip-card.variants.ts`,
  numbers asserted only as an ordering (snappy stiffer than default stiffer than gentle).
- **Corner/clip**: faces are `Surface` (`rounded-lg`, `border-continuous`). No shadow; a card edge
  turning edge-on is a hairline, which is why a face keeps `Surface`'s border.

## 5. States

| State | Behaviour |
| --- | --- |
| front / back at rest | Hidden face: `opacity 0`, `pointerEvents="none"`, removed from accessibility |
| turning (press) | Spring 0↔180; both faces animate, opacity swaps at 90° |
| scrubbing (swipe) | Rotation tracks the finger 1:1 scaled by `swipeDistance`, clamped to [0, 180] |
| settling | On release, velocity-weighted choice of face, spring to 0 or 180 |
| pressed (press trigger) | Whole card scales 0.98 while the finger is down (Pressable `scale` vocabulary) |
| disabled | No gesture; `FlipCard.Trigger` disabled; `accessibilityState.disabled` |
| controlled-rejected | Parent keeps `face`; card springs back to it |
| reduced/calm motion | No rotation; 150ms opacity crossfade — see Motion |

## 6. Accessibility

- **Only the visible face exists to assistive tech.** The hidden face carries
  `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"`
  (Android), set from the **target** face the moment a turn is committed — not at settle, or a
  screen reader would focus into a face that is already fading out. These are JS props, so they
  follow React `face` state, never the per-frame `rotation`.
- **The card is announced on change.** After settle, `AccessibilityInfo.announceForAccessibility`
  speaks `faceLabels[face]` ("Back of card"). With a screen reader on, `onFaceChange` is also the
  place the author moves focus; `FlipCard` itself does not steal focus.
- **A swipe-only card has no accessible turn**, so under `trigger="swipe"` the root exposes
  `accessibilityActions: [{ name: "activate", label: "Flip card" }]` and handles it by calling
  `flip()`. `"press"` gets the same action plus the tap. `"manual"` leaves the action to the
  author's `FlipCard.Trigger`. A test asserts there is **always** at least one non-gesture path.
- **Root role**: `accessible={false}`; the card is a container so its faces' contents (buttons,
  text) stay individually reachable. An optional `accessibilityLabel` is applied as a
  `accessibilityViewIsModal`-free group label only on the visible face wrapper.
- **`FlipCard.Trigger`** is a `Pressable` (`accessibilityRole="button"`), default label
  "Flip card"; its `accessibilityState` carries `expanded`-style info via `accessibilityHint`
  "Shows the back" / "Shows the front".
- **Reduced motion** honoured via `useCalmMotion()` (OS setting or E2E build).

## 7. Motion

- **Rotation is one UI-thread `SharedValue<number>` in degrees, 0 = front, 180 = back.** React
  state `face` is derived from the target, never read per frame.
- **Transform order is load-bearing**: `[{ perspective }, { rotateY | rotateX: "${deg}deg" }]`.
  `perspective` first, or Android draws a flat squash. Front rotates by `rotation`; the back by
  `rotation - 180` so it starts edge-on past 90° and reads correctly (not mirrored) at 180.
- **Backface by angle, not by `backfaceVisibility`**: `resolveFlipFaces(rotation)` →
  `{ frontVisible: n < 90 || n >= 270, backVisible: !frontVisible }` where `n` is the rotation normalised to [0, 360). Each face's
  animated style sets `opacity` from that. The swap is a hard 0/1 at exactly 90° where the card is
  edge-on and invisible, so no crossfade artefact. `backfaceVisibility: "hidden"` is *also* set as
  a belt-and-braces on iOS but nothing depends on it.
- **Press**: Gesture Handler `Gesture.Tap()` on the root toggles. Interactive descendants
  (`Pressable`, `Button`) are nested Gesture Handler taps; Gesture Handler's default arbitration
  gives the deepest recogniser the touch, so a button on the back does not also flip the card.
  **Verify on both simulators** (checklist) — if the ancestor tap fires too, add
  `Gesture.Exclusive` with a `requireExternalGestureToFail` on children via the context.
- **Swipe**: `Gesture.Pan()` with activation offset along the card's cross-to-axis (`axis="y"` →
  horizontal pan, `activeOffsetX([-10, 10])`, `failOffsetY([-14, 14])`) so a vertical scroll
  survives. `onUpdate`: `rotation = clamp(start + delta * 180 / swipeDistance, 0, 180)`.
  `onEnd`: `resolveFlipTarget(rotation, velocity)`, spring to it. Dragging past an edge rubber-bands
  (`resolveRubberBand`) rather than hard-clamping.
- **Haptic** once per crossing of 90° (`shouldTickFlipHaptic(prev, next)`), tracked with a
  `lastSide` shared value so a jittering finger at the midpoint does not buzz.
- **Settle** with `withSpring(target, motionPreset, finished => finished && scheduleOnRN(onFlipEnd))`.
- **Reduced/calm motion**: no rotation at all. `rotation` still goes 0→180 *instantly* (so every
  derived value is the same) and the two faces animate `opacity` 150ms `withTiming`. In calm mode
  swipe still drags but with the crossfade on release (a scrubbed rotation under reduced motion
  would defeat the setting): `trigger="swipe"` degrades to a `activeOffset` threshold flip.
- **Worklet hygiene**: flat exported worklets, no helper-calls-helper; clamp written inline.

## 8. Reuses

- `Surface` (faces) and its `SurfaceVariant`/`SurfacePadding` types — leaf import via `../surface`
  as `Card` does; a face re-publishes `SurfaceProvider` so nested surfaces step correctly.
- `Pressable` for `FlipCard.Trigger`; `HapticFeedback` and `playHaptic` from `pressable.tsx`.
- `useControllableState<FlipCardFace>`, `useCalmMotion`, `lib/cn`, `lib/tv`, `Text`, `Icon`
  (default trigger glyph from Central Icons, name verified in `icons/central.ts`).
- `AccessibilityInfo` from `react-native`.

## 9. Dependencies

- **None new.** Reanimated 4, Gesture Handler, worklets, Pulsar — existing peers.
- `ITEM_META["flip-card"]`: `{ title: "FlipCard", description: "Two faces of one card and a turn between them, by tap, swipe or code.", categories: ["display"] }` (category as lead assigns).
- `PACKAGE_INSTALL` needs no entry. Run `bun run registry:build`; it must resolve `surface` and
  `pressable` as registry dependencies (items), not as packages.

## 10. Sibling / cross-category dependencies

- **Siblings (compare, qr-code): none.** No imports. No wave order.
- **Cross-category**: depends on the already-merged `surface` and `pressable` only. Gaps:
  - No shared "motion preset" module exists; the three presets live in `flip-card.variants.ts`.
    If a later component wants them, extract to `lib/motion`. Out of scope here.
  - A card `Image`/media slot is not provided — faces take arbitrary children.

## 11. Pure logic to unit-test (TDD)

In `flip-card.variants.ts` + `.test.ts`, written first.

```ts
normalizeRotation(rotation: number): number
// 0→0; 180→180; 360→0; -90→270; 540→180

resolveFlipFaces(rotation: number): { frontVisible: boolean; backVisible: boolean }
// 0 → {true,false}; 89.9 → {true,false}; 90 → {false,true}; 180 → {false,true}; 270 → {true,false} (the far side of the
// front again); exactly one of the two is true at every angle (property test, 0..720 by 7.3)

resolveFlipTarget(rotation: number, velocity: number): 0 | 180
// (80, 0) → 0; (100, 0) → 180; (80, +900) → 180 (fast flick forward); (100, -900) → 0; velocity threshold respected; 90 with 0 velocity → current side

rotationFromDrag(start: number, delta: number, distance: number): number
// (0, 100, 200) → 90; (0, -50, 200) → rubber-banded < 0 not clamped here; distance <= 0 → start

resolveRubberBand(rotation: number, max?: number): number
// inside [0,180] unchanged; -30 → between -30 and 0 (damped, monotonic); 210 symmetric about 180; never exceeds ±40 beyond the edge

faceFromRotation(rotation: number): FlipCardFace
// the nearer face; < 90 → "front"

shouldTickFlipHaptic(prev: number, next: number): boolean
// (80, 100) → true; (100, 80) → true; (10, 20) → false; (90, 90) → false; stays false while parked on 90

resolveFaceTransform(face: "front" | "back", axis: FlipCardAxis, rotation: number, perspective: number):
  Array<{ perspective: number } | { rotateX: string } | { rotateY: string }>
// perspective is always first; back at rotation 180 → rotateY "0deg"; back at 0 → "-180deg"; axis "x" uses rotateX

resolveFaceOpacity(face, rotation, isCalm): number
// calm mode: front 1/back 0 for the target face only (no angle); otherwise the 90° rule

resolveFaceA11y(face: FlipCardFace): { front: { hidden: boolean }; back: { hidden: boolean } }
// exactly one hidden; follows the target face

resolveFlipCardClasses({ variant, padding }) // tv: back default variant "secondary", front "default", radius/clip classes, no shadow

resolveFlipCardActions(trigger: FlipCardTrigger): Array<{ name: string; label: string }>
// "press" and "swipe" → one "activate"; "manual" → [] ; never returns [] for swipe (non-gesture path invariant)
```

## 12. Playground demos

`apps/playground/src/demos/flip-card/`, ordered `index.ts` via `defineDemoGroup("flip-card", …)`;
`testID`s: `flip-card`, `flip-card-trigger`.

| File | What it shows | Capture |
| --- | --- | --- |
| `anatomy.tsx` | Front/Back/Trigger on a wallet-style card; flow taps to flip | `hero`, `flow: "flip-card/anatomy"` |
| `swipe.tsx` | `trigger="swipe"`, drag scrubs and settles | capture, flow (pan) |
| `flashcard.tsx` | Question front, answer back, `FlipCard.Trigger` "Reveal" button | capture, flow |
| `vertical-axis.tsx` | `axis="x"` | capture, flow |
| `faces.tsx` | `variant` / `padding` pairs on the faces | capture (still) |
| `controlled.tsx` | `face` driven by a `Switch` outside the card | gallery only |
| `interactive-back.tsx` | A `Button` on the back that does not flip the card | gallery only |
| `reduced-motion.tsx` | Crossfade under `isMotionCalm` | gallery only |
| `manual.tsx` | `trigger="manual"` + ref `flip()` | gallery only |

Five captured, one hero. Label maps as `Record<FlipCardAxis, string>`; `.map` over
`FLIP_CARD_AXES`.
Route `(components)/flip-card.tsx` → `<DemoGallery demos={flipCardDemos} title="FlipCard" />`;
row in `src/app/index.tsx`; `bun run gen-demos`.

## 13. Docs page

`apps/web/content/docs/native/components/flip-card.mdx`:

1. `<Preview id="flip-card/anatomy" title={null} />`
2. **Installation** `<ComponentInstall name="flip-card" />` (pulls `surface`, `pressable`)
3. **Usage** — front/back minimal
4. **Triggers** — `press` / `swipe` / `manual`; the "interactive descendants win" callout
5. **Axis** and **Controlled** (`face`, `onFaceChange`, `onFlipEnd`, ref)
6. **A flashcard** — `FlipCard.Trigger`
7. **Accessibility** — what is hidden, what is announced, the non-gesture path, reduced motion
8. **Sizing** — front in flow, back fills it; `transparent` back callout
9. **API Reference** — anatomy table, `TypeTable` for `FlipCard` (trigger union), `FlipCard.Front/Back`, `FlipCard.Trigger`, `useFlipCard`

`meta.json`: add `"flip-card"` under `---Data Display---` (after `item`, alphabetical-ish) or the
media section.

## 14. Acceptance checklist

- [ ] `flip-card.variants.test.ts` written first, failing, then passing
- [ ] `bun run typecheck` clean; no `any`; `FlipCardProps` is a discriminated union on `trigger`
- [ ] `bun run check` clean; no comments in JSX
- [ ] `AGENTS.md` + Components-table row (`docs.test.ts`)
- [ ] `displayName` on all parts/provider (`DelacourUI.FlipCard.*`) (`display-name.test.ts`)
- [ ] `bun run gen-exports`
- [ ] Demos + `bun run gen-demos`; exactly one `hero`
- [ ] Route file + `src/app/index.tsx` row
- [ ] Docs page + `meta.json`
- [ ] `ITEM_META["flip-card"]` + `bun run registry:build`
- [ ] Changeset (`@delacour/react-native-ui`, minor)
- [ ] Simulator check via `warden claim` + `agent-device` on iOS **and** Android: tap, swipe, scrub half-way and release both sides
- [ ] Back face is not mirrored at rest; no flash of both faces at 90° on Android
- [ ] A `Button` on the back fires its own press and does not flip the card (both platforms)
- [ ] VoiceOver / TalkBack: only the visible face is focusable; "Back of card" is announced after settle; swipe card reachable via the activate action
- [ ] `isMotionCalm` build: crossfade only, no rotation; E2E runner does not stall
- [ ] Card inside a vertical `ScrollView` with `trigger="swipe"`, `axis="y"`: vertical scroll still works
- [ ] Controlled parent that rejects `onFaceChange` springs back to its face
