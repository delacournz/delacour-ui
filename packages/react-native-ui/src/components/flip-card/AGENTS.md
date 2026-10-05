# FlipCard

Two faces of one card and a turn between them — a flashcard, a payment card with its number on
the back, a profile with details behind it. A compound root plus `FlipCard.Front`,
`FlipCard.Back` and `FlipCard.Trigger`, with `useFlipCard()` for a custom child.

`import { FlipCard } from "@delacour/react-native-ui/flip-card";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/flip-card` (+ tuples, types) |
| `flip-card.tsx` | Root: face state, the shared `rotation`, the gesture, the settle, the announcement |
| `flip-card-front.tsx` | `FlipCard.Front` — the in-flow face |
| `flip-card-back.tsx` | `FlipCard.Back` — the `absolute inset-0` face; warns on a `transparent` fill |
| `flip-card-face.tsx` | Internal body both faces share: the animated wrapper, the `Surface`, a11y hiding |
| `flip-card-trigger.tsx` | `FlipCard.Trigger`, a `Pressable` calling `flipTo` |
| `flip-card.context.tsx` | `FlipCardProvider`, `useFlipCard()`, `useFlipCardContext()`, `useFlipCardPart()` |
| `flip-card.types.ts` | `FlipCardFaceProps`, shared by the two faces |
| `flip-card.variants.ts` | Slotted `tv()`, motion presets, every pure resolver; no RN imports |
| `flip-card.variants.test.ts` | |

## Design

- **A flip is a state change, not an animation.** The face is React state
  (`"front" | "back"`), and the rotation — one UI-thread `SharedValue` in degrees, 0 = front,
  180 = back — is derived from it. The failure this prevents is a card visibly showing its back
  while focus, taps and the screen reader still belong to the front. The hidden face takes
  `pointerEvents="none"`, `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"` from the **target** face the moment a turn
  is committed (`resolveFaceA11y`), never from the per-frame angle.
- **Which face is drawn is the angle's decision, not `backfaceVisibility`'s.** Android does not
  honour `backfaceVisibility` reliably and some transform stacks drop it, so each face's opacity
  is `resolveFaceOpacity(face, rotation)` — a hard 0/1 swap at exactly 90°, the edge-on frame
  where neither face shows, so the swap cannot pop. `backfaceVisibility: "hidden"` is still set
  as belt and braces; nothing depends on it.
- **The transform order is load-bearing: `[{ perspective }, { rotateY }]`.** Perspective after
  the rotation draws a flat squash on Android. The back turns by `rotation - 180`, so it starts
  edge-on past 90° and lands flat on 180 reading the right way round, not mirrored.
  `resolveFaceTransform` pins both.
- **`trigger` is a discriminated union.** `swipeDistance` exists only on `trigger="swipe"`, so a
  caller cannot pass it to a card that would ignore it. `"press"` taps anywhere; `"swipe"` scrubs
  the rotation 1:1 (`rotationFromDrag`), rubber-bands past either rest (`resolveRubberBand`,
  never more than 40° beyond) and settles on release by `resolveFlipTarget` — a flick past
  500°/s goes the way it was going, anything slower settles on the nearer face, and an undecided
  release on exactly 90 stays where it started. `"manual"` mounts no gesture at all.
- **A swipe activates along its axis and fails across it.** `axis="y"` is a horizontal pan
  (`activeOffsetX ±10`, `failOffsetY ±14`), so a card in a vertical `ScrollView` still lets the
  page scroll; `axis="x"` swaps both.
- **One commit path, and a re-run token for the refused case.** A tap, a release, a ref call and
  a `FlipCard.Trigger` all go through `commitTo`, which starts the settle, records the rotation it
  is heading for and bumps a counter. The sync effect then skips a spring already under way and
  restarts one when a controlled parent refused the face — `Switch`'s pattern: a refused commit
  leaves `face` unchanged, so without the counter there is nothing to re-run on and the card
  stays half-turned. `onFaceChange` fires at the commit, `onFlipEnd` when the spring finishes.
- **The haptic plays once per crossing, with hysteresis.** `shouldTickFlipHaptic` is fed the side
  it last played on (0 or 180) and has to clear 90 by 4°, so a finger resting on the edge-on frame
  does not buzz every frame. It is an animated reaction on `rotation`, so a tap, a drag, a ref call
  and a controlled change all tick the same way.
- **Calm motion turns nothing.** Under the OS reduce-motion setting or `DelacourProvider`'s
  `isMotionCalm`, both faces stay flat and the same `rotation` travels 0→180 on a 150 ms timing
  that `resolveFaceOpacity` reads as a linear crossfade — so `onFlipEnd`, the haptic and the
  announcement behave identically. A swipe card no longer scrubs (a turn that follows the finger
  is the motion the setting removed): the drag is measured and the release flips past half way.
  The timing ends, so an E2E runner waiting for the screen to settle does not stall.
- **The press dips the whole card to 0.98** on `Pressable`'s spring, so a tap card presses like
  every other control. Swipe and manual cards do not dip.
- **The front is in flow and the back fills it.** The root's `className` is the footprint
  (`h-48`, `aspect-[1.586]`); without one, the front's content sizes the card and the back takes
  that size, overflowing if its own content is taller. Each face is a `Surface` — corner, hairline
  and fill from there, no shadow — and defaults to the fill ladder's `default` front over a
  `secondary` back, so the two read apart unasked. `FlipCard.Back` warns on `transparent`: it
  would show the front through it on the frames either side of the swap.
- **Anything passed to the root that is not a face renders beneath the card.** The back fills the
  card, so a `FlipCard.Trigger` written beside the faces would be covered by it; the root splits
  its children and stacks the rest under the card with a gap. A face must be a direct child to be
  recognised — wrapped in a fragment or a component of its own, it lands beneath the card.
- **Screen readers always have a non-gesture path.** The card is a container
  (`accessible={false}`), so controls on its faces stay reachable one by one. `"press"` exposes
  `activate` on the root and a screen reader's double-tap on any face content lands the tap.
  `"swipe"` has no tap, and iOS only runs an action on an accessibility element, so the
  **visible face** becomes one element holding `activate` ("Flip card") and the card's
  `accessibilityLabel` — its content still reads as its label. `"manual"` leaves the path to the
  author's `FlipCard.Trigger`. `resolveFlipCardActions` is tested to never return nothing for a
  gesture trigger. After a turn settles, `AccessibilityInfo.announceForAccessibility` speaks
  `faceLabels[face]`; the card never moves focus itself — `onFaceChange` is where an author does.
- **`FlipCard.Trigger` is a `Pressable` under every trigger.** A "Flip" button beneath a swipe
  card is the accessible alternative to dragging. With no children it is an icon-only square on
  the button scale with Central Icons' `IconArrowRotateLeftRight`, labelled "Flip card"; its hint
  names the destination ("Shows the back").
- **No size axis.** The card has no intrinsic scale, and the footprint is already a `className`.
- **Motion presets live here, not in `lib/`.** `default` (damping 18, stiffness 160), `snappy`
  (22, 260), `gentle` (16, 90); the test pins only the stiffness ordering. Extract to `lib/motion`
  only when a second component wants them.
- **Worklet hygiene.** Every resolver a worklet calls is flat — `normalizeRotation`,
  `resolveFaceOpacity` and `faceFromRotation` each restate the fold inline rather than calling one
  another, because a worklet helper calling a helper crashes the UI thread (see
  [Pressable](../pressable/AGENTS.md)).

## Spike: nested-tap arbitration

A `Button` on a face of a `trigger="press"` card must fire its own press and **not** also flip the
card. Both are Gesture Handler taps — the card's on its root, the button's from `Pressable` — and
the expectation was that Gesture Handler's default arbitration hands the touch to the deepest
recogniser.

**Outcome (iOS, 2026-10-05):** holds with no extra wiring. On `flip-card/interactive-back`, pressing
the back's `Button` counted a copy and the card stayed on its back. No `Gesture.Exclusive` or
`requireExternalGestureToFail` was needed. Android is unchecked — see below.

## Verification

- **Faces are found by `displayName` as well as by reference.** `splitFlipCardChildren` asks
  `isFlipCardFaceName` when `child.type` is not the imported part, the same as `Switch`'s
  `isSwitchThumbElement`. The package ships raw `.tsx`, so React Compiler or a second Metro copy of
  the module can hand over a `type` that is a different object for the same component.
- **No worklet reads a module binding from a parameter default.** The worklets plugin captures what
  a worklet's body reads, not its parameter defaults: `resolveRubberBand(rotation, max =
  FLIP_CARD_RUBBER_BAND)` threw *Property 'FLIP_CARD_RUBBER_BAND' doesn't exist* on the UI thread
  the first time a swipe card was dragged. The default is now resolved in the body, and a test in
  `flip-card.variants.test.ts` fails on any worklet with an identifier default.

Checked on an iOS 26 simulator (iPhone 17) through the `preview` route, with agent-device:

| What | Result |
| --- | --- |
| Tap turns the card; the back reads upright at rest; perspective visible mid-turn | ✔ |
| Only the visible face is in the accessibility tree after a turn | ✔ |
| A `Button` on the back fires and does not turn the card | ✔ |
| Swipe: a short drag settles back, a long drag turns it, a reverse drag returns it | ✔ |
| `axis="x"` tips top over bottom, back upright | ✔ |
| `trigger="manual"`: a tap on the card does nothing; the ref's `flip()` turns it | ✔ |
| `FlipCard.Trigger` beneath the card turns it and is not covered by the back | ✔ |
| Controlled parent refusing the change: card ends on the parent's face | ✔ |
| `isMotionCalm`: crossfade, no rotation | ✔ |

**Not yet checked:** Android (no emulator lease taken — the Android-specific concerns are the
perspective squash and a flash of both faces at 90°), VoiceOver / TalkBack speech and the swipe
card's `activate` action, a swipe card inside a vertical `ScrollView`.

## Previews (follow-up)

`anatomy` (**hero**), `swipe`, `flashcard`, `vertical-axis` and `faces` carry `meta.capture`, and
the four animated ones have flows under `.argent/flows/previews/flip-card/`, written but never run.
`flip-card` sits in `AWAITING_FIRST_CAPTURE` in `apps/playground/src/demos/demos.test.ts` until the
media are shot; remove it in that commit, and add `<Preview id="flip-card/anatomy" title={null} />`
plus a `<Preview>` per section to `flip-card.mdx` in the same change — a `<Preview id>` for an
uncaptured demo throws at render.
