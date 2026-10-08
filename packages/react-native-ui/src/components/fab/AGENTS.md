# Fab

One primary action floating over the screen it belongs to — "New note" over a
list — and, as `Fab.Group`, a dial of related actions that unfold out of it.
Compound root plus `Fab.Label`, `Fab.Group` and `Fab.Action`.

`import { Fab } from "@delacour/react-native-ui/fab";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/fab` |
| `fab.tsx` | Root + the `Object.assign` compound surface |
| `fab-label.tsx` | `Fab.Label` |
| `fab-group.tsx` | `Fab.Group` — the trigger, the scrim and the dial's one spring |
| `fab-action.tsx` | `Fab.Action` — one dial entry: a small round button and a label chip |
| `fab.context.tsx` | `FabContext`, `FabGroupContext` and the per-action index context, with their hooks |
| `fab.types.ts` | `FabSharedProps` — the axes `Fab` and `Fab.Group` both take |
| `fab.variants.ts` | The slotted `tv()` and the pure resolvers, no RN imports |
| `fab.variants.test.ts` | |

## Design

- **Sizes**: `sm`, `md` (default), `lg` — 44, 56 and 64pt, from
  `--spacing-fab-*`. **Variants**: `primary` (default), `secondary`, `surface`,
  `destructive`. **Placements**: `bottom-start`, `bottom-center`, `bottom-end`.
- **The footprint is its own token, not the button's.** A fab sits over
  content rather than in a row of controls, so it is a step larger than any
  button, and a form retuning `--spacing-button-*` must not move the one thing
  floating over its list. Declared in both `tokens.css` and theme.css's
  `@variant native` block, per the package rule, and registered in
  `styles/tokens.ts`; `tokens.test.ts` holds the floor at 44pt.
- **Icons on `Fab` are composed; on `Fab.Group` and `Fab.Action` they are a
  prop.** `Fab` matches `Button`: it publishes its icon step (`sm` → `icon-md`,
  `md`/`lg` → `icon-lg`, `resolveFabIconSize`) and its variant's foreground
  through `IconDefaultsProvider`, so a bare `<Icon />` comes out right. The
  group renders and **rotates** its trigger glyph, and each action draws two
  things — a round button and a label chip — from one icon and one label, so
  both take an `icon` component and own how it is drawn.
- **It casts a shadow, and nothing else in the kit does.** `shadow-lg` on the
  fab and on each dial button. A fab is the one control floating above the
  content; flat, it reads as a sticker on the list. The root carries no
  `overflow-hidden`, which would clip that shadow on Android.
- **`placement` pins; omitting it leaves the fab in flow.** Pinned, the fab sits
  in a `pointerEvents="box-none"` box at `bottom = offset + insets.bottom` and
  `start`/`end = offset` — logical edges, so RTL flips with no code.
  `isSafeAreaAware` (default `true`) is what adds the inset; the inset is read
  from `SafeAreaInsetsContext` directly, so a fab outside a safe-area provider
  gets `0` rather than a throw.
- **Centre spans the row instead of using `alignSelf`.** An absolute child's
  `alignSelf` is read on the parent's *cross* axis — horizontal only in a
  column — so a fab written into a `flex-row` would have centred vertically.
  `resolveFabPlacementStyle` returns `start: 0, end: 0, alignItems: "center"`
  instead. That is the one shape this resolver returns that the spec sketch
  listed as `alignSelf`.
- **One spring drives the dial.** `Fab.Group` holds a single `progress` shared
  value, `withSpring` to 0 or 1 with a little overshoot. Each action derives
  its own window on the UI thread with `resolveDialProgress` —
  `clamp((open − i·0.08) / (1 − (n−1)·0.08), 0, 1)`, index 0 nearest the
  trigger — so there are no per-action timers, and closing halfway through
  opening simply runs the same cascade backwards. The window is floored so a
  stagger too wide for the count degrades to a step, never a NaN.
- **Actions are unmounted while closed, not hidden.** They mount in the render
  that opens the dial and unmount from the close animation's `finished`
  callback, so a screen reader cannot walk into invisible buttons. A reopen
  mid-close cancels that animation, `finished` is false, and nothing unmounts.
- **The glyph turns 45°, plus → cross**, read off the same spring and clamped
  so the overshoot does not wobble it. `isRotatedOnOpen={false}` holds it still
  for a glyph that is not a plus.
- **Pressing an action runs it, then closes the dial.** The label chip presses
  too — a finger aims at the words — but it is hidden from assistive technology
  so a screen reader meets each action once, by its button.
- **The chip sits on the side facing into the screen.** `resolveLabelSide`:
  left of the button at `bottom-end`, right at `bottom-start`, above at
  `bottom-center`. Each action's button sits in an anchor as wide as the
  trigger (`w-fab-*`), so the small buttons share the trigger's centre line.
- **The group is a layer, so write it in the screen's root container.** It
  renders an `absolute inset-0` box holding the scrim and the pinned dial, and
  covers whatever its parent is. Inside a scroll view's content it would cover
  the content box, not the screen. The layer is `box-none`, so while closed it
  takes no touches.
- **The scrim is `bg-overlay`, faded by the spring.** The token carries its own
  alpha, so the fade runs 0 → 1 and lands on the theme's overlay. Tapping it
  closes; it is a button labelled "Close".
- **Android back closes an open dial**, through a `BackHandler` subscription
  that exists only while the dial is open.
- **`isOpen` / `defaultOpen` / `onOpenChange`** through `useControllableState`.
- **Haptics are off by default.** `haptic` on `Fab` plays on press; on
  `Fab.Group` it plays on the trigger and on every action.
- **Reduced motion fades the dial in 150ms** with no rise, scale or stagger —
  the dial still appears, because appearing is the information. The glyph
  still turns, on the same timing.
- **A11y.** Every fab and action is a `button`. The group trigger carries
  `accessibilityState={{ expanded }}` and a required `accessibilityLabel`; the
  layer is `accessibilityViewIsModal` while open. A round `Fab` with no
  `accessibilityLabel` warns in development — there is no text to fall back on.
- **The group trigger extends with `label` while closed.** Open, it is a
  circle again: the label names what the dial is for, and the cross that
  replaces the plus is the only thing the trigger does then.
- **`Fab.Group` also takes `offset` and `isSafeAreaAware`**, which the spec
  sketch listed only on `Fab`. Both are on `FabSharedProps`, so a group pinned
  above a tab bar can clear it the same way a lone fab does.

## Out of scope

- **A glass material.** It needs a native peer the catalog does not carry.
- **`layout="menu"` and `layout="native"`** — a menu panel out of the fab. A
  follow-up once `Menu` has merged, reusing its rows.
- **A blurred scrim.** It needs `expo-blur`, which is not a peer.
- **Design-system styles do not retune the fab.** `@delacour/design-system`'s
  `STYLES` carry no `spacing-fab-*`, so a style switch leaves the fab at
  44/56/64 while buttons move. Add the three numbers there when a style needs a
  different fab.
