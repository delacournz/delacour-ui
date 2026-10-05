# Marker — design spec

Phase `FB-2` of plan `FEEDBACK-2026-10`. Folder `packages/react-native-ui/src/components/marker/`,
import `@delacour/react-native-ui/marker`.

## Purpose

An inline note between the turns of a conversation or the entries of a feed: something that
**happened**, not something someone **said**. "Searched 128 files", "Read config.ts", "Yesterday".
Centred, muted, no speaker, no bubble. On mobile it sits in an inverted chat list, an activity
log, or a timeline, and is optionally tappable to expand the step it summarises.

## API

```tsx
import { Marker } from "@delacour/react-native-ui/marker";

<Marker>
  <Marker.Icon><Icon icon={IconMagnifyingGlass} /></Marker.Icon>
  <Marker.Content>Explored 4 files</Marker.Content>
</Marker>

<Marker onPress={() => expand(step)}>
  <Marker.Icon><Icon icon={IconMagnifyingGlass} /></Marker.Icon>
  <Marker.Content shimmer={step.isRunning}>Searching files</Marker.Content>
</Marker>

<Marker variant="separator">
  <Marker.Content>Yesterday</Marker.Content>
</Marker>
```

```ts
export const MARKER_VARIANTS = ["default", "border", "separator"] as const;
export type MarkerVariant = (typeof MARKER_VARIANTS)[number];

/** Static unless given something to do — the Badge rule. */
type MarkerInteraction =
	| { onPress?: undefined; onLongPress?: undefined }
	| ({ onPress: () => void } & MarkerPressableProps)
	| ({ onLongPress: () => void } & MarkerPressableProps);

export type MarkerProps = MarkerInteraction & {
	/** Default `default`. */
	variant?: MarkerVariant;
	/** Owned disabled state; announced. Only meaningful when interactive. */
	isDisabled?: boolean;
	className?: string;
	children: ReactNode;
	testID?: string;
	accessibilityLabel?: string;
};

export type MarkerIconProps = ViewProps;          // decorative slot
export type MarkerContentProps = TextProps & {
	/** A sweep across the text while the step runs. Drop it when the step ends. */
	shimmer?: boolean;
};
```

Exact typing of the interaction union is the implementer's call; the rule is **no handler → plain
`View`, any handler → `Pressable`**, and it must reuse `resolveBadgeInteractive`'s shape (write a
`resolveMarkerInteractive` in `marker.variants.ts`, or import Badge's from the leaf
`../badge/badge.variants` — prefer its own, the two may diverge). `MarkerPressableProps` is the
subset of `PressableProps` that makes sense here (`feedback`, `haptic`, `hitSlop`) — omit
`asChild`, `busy`, `children`, `disabled` the way `BadgeProps` does. Default press feedback
`fade` (a scale on a full-width row reads as a lurch).

Compound root plus `Marker.Icon` and `Marker.Content`, one file per part, `Object.assign` surface,
`marker.context.tsx` leaf for `variant`/`isDisabled`, `useMarker()` hook (house pattern B).
String children of the root are wrapped in `Marker.Content` automatically (Badge/Button rule).

## Variants

| Variant | Look | Use |
| --- | --- | --- |
| `default` | Centred row: icon + text, muted, no chrome | A step that happened |
| `border` | Same row inside a hairline-bordered capsule (`border border-border rounded-full px-3 py-1`) | Closing a section — "Task complete" |
| `separator` | Centred label with a `Separator` rule each side, filling to the edges | Day dividers |

- `separator` composes two `Separator`s (`flex-1`, `self-center` on the cross axis) around the
  content — never a hand-drawn border, so it inherits Separator's hairline and its
  hidden-from-AT rule. **Note** `Separator`'s `self-stretch` long-axis rule: horizontal inside a
  row, its long axis is width, so give it `flex-1` and verify on the simulator it does not
  collapse to zero.
- No sizes. A marker is one quiet line; `text-xs` muted for `default`/`border`, `text-xs` medium
  uppercase-free for `separator`. If a size axis is ever needed it is an addition, not a guess now.
- Colour: `text-muted-foreground` on `Marker.Content`'s `Text` (package rule 1 — colour on the
  `Text`), icon colour from `useThemeColor("muted-foreground")` published through
  `IconDefaultsProvider` at `size-icon-xs` so a bare `<Icon>` inside `Marker.Icon` is right with
  nothing said. Disabled: `opacity-50` on the root.
- Vertical rhythm: `py-2` on the root so stacked markers between bubbles breathe; `self-stretch`
  row, `items-center justify-center`, `gap-1.5`.

## Shimmer

`Marker.Content shimmer` says the step is **running**. The intended look is a highlight band
sweeping across the glyphs. A glyph-clipped band needs a mask
(`@react-native-masked-view/masked-view` or Skia text), and this package has neither as a peer —
**scoped out** (see README). Ship instead:

- A UI-thread opacity sweep on the text: opacity oscillates between ~0.45 and 1 on a cosine over
  `MARKER_SHIMMER_CYCLE_MS` (~1.6 s). Reuse the shape of `useSkeletonClock`
  (`ReduceMotion.Never` on the repeat, gated one level up) — copy the pattern into a marker-local
  hook rather than importing the skeleton's clock across folders (it is not a leaf by the rule's
  definition: it imports Reanimated hooks, fine, but keep the coupling out).
- It is decorative: gate with `useCalmMotion()`. Calm → text drawn at full opacity, still.
- `shimmer` off → the loop is cancelled, opacity returns to 1 (with a short timing, not a snap).
- Document in `AGENTS.md`: "Drop it the moment the step finishes — a marker that shimmers forever
  reads as a stuck one."
- Follow-up recorded in `AGENTS.md`: a glyph-masked band if a mask peer is ever adopted.

Pure: `markerShimmerOpacity(progress: number): number` worklet in `marker.variants.ts`
(`"worklet"` directive; testable as plain function), `resolveMarkerShimmer({ shimmer, isCalm })`.

## Accessibility

- Static marker: plain `View`, `accessible`, `accessibilityRole="text"`, label = content text. No
  button announcement.
- Interactive: `Pressable` with `accessibilityRole="button"`, `accessibilityState={{ disabled }}`;
  caller can pass `accessibilityHint` (e.g. "Shows the files").
- `Marker.Icon`: `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`
  — it duplicates the text.
- Separators already hidden.
- Running shimmer: `accessibilityState={{ busy: true }}` on the root while any child content
  shimmers — implement via context (content registers `shimmer` up) or, simpler, accept a root
  `isBusy` and document the pairing. Pick the simpler one that is honest; record the choice.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/marker` |
| `marker.tsx` | Root + `Object.assign` surface |
| `marker-icon.tsx` | `Marker.Icon` |
| `marker-content.tsx` | `Marker.Content`, with the shimmer |
| `marker.context.tsx` | `MarkerContext`, `useMarker()`, `useMarkerPart()` |
| `marker.variants.ts` | Slotted `tv()`, `MARKER_VARIANTS`, constants, resolvers, shimmer worklet — no RN imports |
| `marker.variants.test.ts` | Written first |
| `AGENTS.md` | Design decisions, file map |

## Pure logic to test first

- `markerVariants` slots per variant: `border` carries a border + rounded-full; `default` and
  `separator` carry no border; the root carries no `text-*` (rule 1); content slot carries
  `text-muted-foreground`; no `h-*` on root.
- `resolveMarkerInteractive` — none / onPress / onLongPress.
- `markerShimmerOpacity` — 1 at 0 and 1, min at 0.5, never below the floor, continuous at the wrap.
- `resolveMarkerShimmer` — calm stills it, off stays off.
- Icon colour token (`muted-foreground`) exists in both themes.

## Playground demos (`apps/playground/src/demos/marker/`)

Read `apps/playground/src/demos/AGENTS.md`. Then `bun run gen-demos`.

1. `conversation` (**hero**, capture) — two chat-ish bubbles with markers between them (built from
   `Surface`/`Text`, no new component), a `separator` day divider at the top.
2. `variants` (capture) — default, border, separator.
3. `pressable` (capture) — tap expands a list of file names beneath (Collapsible is fine).
4. `running` (capture still; the demo toggles `shimmer` with a button to show it stopping).
5. `disabled`.

Route `apps/playground/src/app/(components)/marker.tsx` and a row on `src/app/index.tsx`.

## Docs page

`apps/web/content/docs/native/components/marker.mdx`: hero Preview, Installation, Usage,
Variants, Pressable, Running (shimmer, and the rule to drop it), Accessibility, Props
(Marker / Marker.Icon / Marker.Content).

## Registry and release

- `ITEM_META.marker` in `packages/cli/src/registry/config.ts`; `registry:build`; commit `registry/`.
- Changeset: `minor` on `@delacour/react-native-ui` — "Add Marker, a centred inline note for steps
  and day breaks between conversation turns."

## Acceptance checklist

- [ ] `marker.variants.test.ts` written first and green.
- [ ] Static marker is a `View` (no button role); interactive one is a `Pressable` with button role.
- [ ] `separator` rules reach both edges and stay one hairline in both themes.
- [ ] `border` capsule hugs its content, centred.
- [ ] Shimmer runs on the UI thread, stops cleanly, and stills under reduce motion and `isMotionCalm`.
- [ ] Icon hidden from VoiceOver; content read once.
- [ ] `displayName`s on root, parts, context provider.
- [ ] Folder `AGENTS.md`, package **Components** row, `gen-exports`, demos + `gen-demos`, docs page,
      registry entry, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
- [ ] Simulator verification via warden + agent-device, or its absence recorded in the commit body.
