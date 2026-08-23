# native-ui — Shared React Native Components

A standalone React Native component library. Styling is Uniwind (Tailwind v4 for
React Native); interaction is Reanimated + Gesture Handler; haptics are Pulsar.

This library has no relationship to, and takes no dependency on, any third-party
React Native component kit. Do not add one, and do not port patterns from one.

## Stack

- **Uniwind** — Tailwind v4 for React Native (`className` on RN components)
- **tailwind-variants** (`tv`) — variant systems
- **react-native-reanimated** — UI-thread animation
- **react-native-worklets** — worklet threading (`scheduleOnRN`, `scheduleOnUI`)
- **react-native-gesture-handler** — the Gesture API
- **react-native-pulsar** — worklet-callable haptics
- **Central Icons** — the icon set (never Lucide, Hugeicons, or anything else)

## Commands

```bash
bun run typecheck          # tsc --noEmit
bun run check              # Biome lint + format
bun test                   # unit tests (pure logic only — see Testing)
bun run gen-exports        # regenerate package.json exports
```

## Directory structure

One component per folder. The folder's `index.ts` is that component's public
entry point, and the folder name is its export subpath.

```
src/
├── components/
│   ├── button/
│   │   ├── index.ts              → @delacour/native-ui/button
│   │   ├── button.tsx            Root + the Object.assign compound surface
│   │   ├── button-label.tsx      Button.Label
│   │   ├── button-start-content.tsx  Button.StartContent
│   │   ├── button-end-content.tsx    Button.EndContent
│   │   ├── button.context.tsx    ButtonContext, useButton(), useButtonContext(), useButtonPart()
│   │   ├── button.types.ts       Prop types shared by two or more parts
│   │   ├── button.variants.ts    Pure tv() slots, no RN imports
│   │   └── button.variants.test.ts
│   ├── icon/
│   │   ├── index.ts              → @delacour/native-ui/icon
│   │   ├── icon.tsx              Icon, and the one withUniwind wrapper (see rule 6)
│   │   ├── icon.context.tsx      IconDefaults, IconDefaultsProvider, useIconDefaults()
│   │   ├── icon.variants.ts      Pure tv() + the size-class ladder, no RN imports
│   │   └── icon.variants.test.ts
│   ├── list-group/
│   │   ├── index.ts              → @delacour/native-ui/list-group
│   │   ├── list-group.tsx        Root + the Object.assign compound surface
│   │   ├── list-group-item.tsx   ListGroup.Item, and the bare-text wrap it owns
│   │   ├── list-group-item-prefix.tsx       ListGroup.ItemPrefix
│   │   ├── list-group-item-content.tsx      ListGroup.ItemContent
│   │   ├── list-group-item-title.tsx        ListGroup.ItemTitle
│   │   ├── list-group-item-description.tsx  ListGroup.ItemDescription
│   │   ├── list-group-item-suffix.tsx       ListGroup.ItemSuffix
│   │   ├── list-group.context.tsx  ListGroupContext, useListGroup(), useListGroupPart()
│   │   ├── list-group.types.ts     Prop types shared by two or more parts
│   │   ├── list-group.variants.ts  Pure tv() slots, no RN imports
│   │   └── list-group.variants.test.ts
│   ├── pressable/
│   │   ├── index.ts              → @delacour/native-ui/pressable
│   │   ├── pressable.tsx         The Gesture API primitive
│   │   ├── pressable.variants.ts   Shared feedback vocabulary, no RN imports
│   │   └── pressable.variants.test.ts
│   ├── screen/
│   │   ├── index.ts              → @delacour/native-ui/screen
│   │   ├── screen.tsx            The Object.assign compound surface
│   │   ├── screen-root.tsx       The root box and its provider — see Screen for why it is split out
│   │   ├── screen-navbar.tsx     Screen.Navbar, plus its own nested surface
│   │   ├── screen-navbar-*.tsx   Title, Subtitle, BackButton, Background
│   │   ├── screen-content.tsx    Screen.Content
│   │   ├── screen-view.tsx       Screen.View
│   │   ├── screen-header.tsx     Screen.Header
│   │   ├── screen-footer.tsx     Screen.Footer
│   │   ├── screen-scroll-area.tsx     Screen.ScrollArea
│   │   ├── screen-flat-list.tsx       Screen.FlatList
│   │   ├── screen-section-list.tsx    Screen.SectionList
│   │   ├── screen-legend-list.tsx     Screen.LegendList
│   │   ├── screen-chat-list.tsx       Screen.ChatList
│   │   ├── screen-loading.tsx         Screen.Loading
│   │   ├── screen-error.tsx           Screen.Error
│   │   ├── screen-list-component.tsx  A list header/footer prop, as a node
│   │   ├── screen-debug.ts       SCREEN_DEBUG_COLORS
│   │   ├── screen.context.tsx    ScreenProvider, useScreen(), useScreenPart()
│   │   ├── screen.types.ts       Prop types shared by two or more parts
│   │   ├── screen.variants.ts    Pure tv() slots + the footer maths, no RN imports
│   │   ├── screen.variants.test.ts
│   │   └── use-screen-scroll-insets.ts  The reserve every scrollable shares
│   ├── separator/
│   │   ├── index.ts              → @delacour/native-ui/separator
│   │   └── separator.tsx         The tv() and the component, in one file
│   ├── spinner/
│   │   ├── index.ts              → @delacour/native-ui/spinner
│   │   ├── spinner.tsx           Root + the Object.assign compound surface
│   │   ├── spinner-content.tsx   Spinner.Content, the rotating layer
│   │   ├── spinner-arc.tsx       The default arc glyph
│   │   ├── spinner.context.tsx   SpinnerContext, useSpinner(), useSpinnerContext()
│   │   ├── spinner.variants.ts   Pure tv() slots + resolvers, no RN imports
│   │   └── spinner.variants.test.ts
│   └── text/
│       ├── index.ts              → @delacour/native-ui/text
│       ├── text.tsx              Root, all twelve presets, the Object.assign surface
│       ├── text.context.tsx      TextClassProvider, useTextClass()
│       ├── text.variants.ts      Pure tv() + resolveTextClass, no RN imports
│       └── text.variants.test.ts
├── hooks/            use-controllable-state, use-theme-color, use-keyboard-state-sync
├── icons/central.ts  Central Icons re-export
├── lib/              cn, tv, merge-props, compose-refs, slot, keyboard-animation
├── styles/           index / base / tokens / theme CSS, plus tokens.ts
└── uniwind-env.d.ts  /// <reference types="uniwind/types" />
```

Everything belonging to a component — sub-components, variants, tests, local
hooks, helpers — lives in its folder and is re-exported from that `index.ts`.
Nothing outside reaches past the index into a component's internals.

## The three component patterns

**A — Styled wrapper.** A component with no state that maps props to classes.
Example: `Icon`, which also reads `IconDefaultsProvider` so a parent can set
size and colour for its whole subtree instead of every call site repeating them.

**B — Compound + context.** A root that shares `variant`/`size`/`isDisabled`
through context with dot-notation sub-components, plus a `useX()` hook so a
custom child can match the parent without prop drilling. Example: `Button` with
`Button.Label`, `Button.StartContent`, `Button.EndContent` and `useButton()`.
Reach for this over adding boolean props. See **Compound component layout**
below for how the files are arranged.

**C — `tv()` variants.** Size and variant axes defined in a `tv()`, never inline
at the call site. Where that `tv()` lives depends on how many parts read it.

A component with more than one styled part uses **one slotted `tv()` in a
`*.variants.ts` sibling**, so a shared axis is declared once rather than restated
per part. `Button`, `ListGroup` and `Spinner` all do, and the sibling is what
makes it possible: the slot set is read by files that cannot import each other's
roots without closing a cycle (rule 3), so it needs a leaf of its own. The same
file is where that component's pure resolvers live — see **Testing**.

A component that is a **single styled element with no pure resolvers** declares
its `tv()` above the component in its own file and exports it from there, the way
shadcn/ui does. `Separator` is the one that qualifies today. Nothing else shares
its slot set, so a sibling would buy nothing but a second file to open.

`Pressable` holds no `tv()` at all — see its section for why.

## Rules

1. **Text colour goes on the `Text`, never the parent.** A React Native `View`
   does not cascade colour to a `Text` descendant the way a DOM element does.
   `buttonVariants`' `label` slot owns `text-*`; its `root` slot must not.
2. **No `"use client"`.** That is an RSC directive; it means nothing here.
3. **No package-wide barrel.** Import from the subpath:
   `@delacour/native-ui/button`. This is what lets an app skip resolving
   optional peers it never uses. A component folder's own `index.ts` is its
   entry point, not a barrel — never add a top-level `src/index.ts`.

   *One exception, and it exists to prevent a cycle:* a **leaf** module —
   `button.context.tsx`, `button.variants.ts` — may be imported directly across
   component folders. The hazard is real: `Button` renders a `Spinner`, so if
   `spinner.tsx` imported `../button`, that index would pull `button.tsx`
   straight back in. Metro serves a partially initialised module for a cycle, so
   `ButtonContext` would be `undefined` at import time and the app would red-box
   on a cold start. If a cross-folder import is ever needed, reach for the leaf
   and never for `../button`.

   *`Spinner` no longer needs one at all.* It used to read the button's context
   to recompute the icon size and foreground the button had **already** published
   through `IconDefaultsProvider` around the very subtree the spinner sits in.
   One inheritance path is now the whole story — `useIconDefaults()`. Do not add
   the second one back.

   *The same hazard applies inside a folder.* Now that compound parts have their
   own files, there are two new ways to close a cycle. **A part must never
   import its own folder's `index.ts`, and never import its own root**
   (`./button`, `./spinner`). It reaches shared state through the
   `{name}.context.tsx` leaf and shared prop types through `{name}.types.ts` —
   both import nothing but React and React Native types. `spinner.context.tsx`
   exists precisely for this: `SpinnerContent` needs `useSpinner`, and reading it
   from `./spinner` would close `spinner.tsx ⇄ spinner-content.tsx`.
4. **Run `bun run gen-exports`** after adding or removing a component folder or
   a file under `src/hooks`, `src/lib`, or `src/icons`. Never hand-edit the
   `exports` map. A component folder without an `index.ts` fails the script.
5. **Central Icons only**, via `@delacour/native-ui/icons/central`.
6. **Never wrap a React Native or Reanimated component with `withUniwind`.**
   `View`, `Text`, `Pressable`, `Animated.View` and friends already accept
   `className`. `withUniwind` is only for third-party components (`expo-image`,
   `expo-blur`), and a given component may only be wrapped once, in one file.

   *Central Icons is the one carve-out, and it is already spent.* `icon.tsx`
   wraps a local `IconGlyph` proxy that takes the glyph as **data**, so a single
   wrapper covers the whole two-thousand-icon set instead of one per glyph —
   still one component wrapped once, in one file. Do not wrap a Central Icon
   directly, do not wrap the proxy anywhere else, and do not add a second
   wrapper for `Svg`. See **Sizing** for why the wrapper has to exist at all.
7. **Native modules are peer dependencies, never dependencies.** Two copies of
   a native module register twice and break at runtime.
8. **`cn()` for every caller-supplied `className`, and `tv` from `lib/tv`.**
   Uniwind does not deduplicate conflicting utilities on its own. There are
   **two** mergers here and both need the semantic size tokens: `cn()` merges a
   caller's className, and `tv()` merges slots and variants through a
   tailwind-merge instance of its own. Never import `tv` from
   `tailwind-variants` directly — a bare `tv` does not know what `button-md`
   is, drops `text-button-md` into tailwind-merge's text *colour* group, and
   silently strips the label's colour. `src/styles/tokens.ts` holds the one
   config both are built from.
9. **No `any`.** Discriminated unions over loose types.
10. **Token names diverge from the web package where the mobile kit needs
    them to.** This package uses `danger` / `danger-soft` (matching the button
    variant names) and adds `tertiary`, where the web package uses
    `destructive`. `X-foreground` always means "content drawn on an `X`
    surface" — keep that meaning when adding a token.

## Button

The reference implementation for the patterns above.

- **Variants**: `primary`, `secondary`, `tertiary`, `outline`, `ghost`,
  `danger`, `danger-soft`. **Sizes**: `sm`, `md`, `lg`.
- **Icons are composed, never passed as props.** Put an `Icon` in the children,
  before or after the label. The button wraps its subtree in an
  `IconDefaultsProvider` carrying `buttonVariants({ size }).icon()` and
  `BUTTON_FOREGROUND_TOKEN[variant]`, so a bare `<Icon icon={IconPlus} />`
  comes out the right size and colour with nothing said at the call site. An
  explicit `size` or `color` on the icon still wins. `Button.StartContent` /
  `Button.EndContent` remain for wrapping non-icon content.
- **`isIconOnly`** gives a square footprint. Always pair it with an
  `accessibilityLabel`; there is no text for a screen reader to fall back on.
- **String children** are wrapped in a `Button.Label` automatically. React
  Native crashes on bare text outside a `<Text>`, so never render a raw string
  in a component that accepts free-form children without doing the same. Note
  that *consecutive* strings collapse into one label — `Row {i}` is a single
  piece of text, and wrapping each part separately would space them apart by
  the button's own `gap`.
- **A button is a `Pressable`.** `ButtonProps` extends `PressableProps`, so
  `feedback`, `haptic` and the rest are inherited rather than restated; only the
  default differs, `scale`. It carried a narrowed `ButtonFeedback` union for a
  while — that is gone, because a second definition of a prop the button does
  not change is a definition that can drift. **Do not add ripple, ink, glow or
  highlight overlays** — no wash layers on pressables in this library. That rule
  is about wash layers, not the opacity axis, which `fade` and `scale-fade` are
  welcome to use.
- **`isLoading` replaces the icon, it does not join it.** The spinner takes the
  place of the composed `Icon` on the side `spinnerPlacement` names — the first
  at `start`, the last at `end` — so the label does not shift when work begins
  and shift back when it ends. The swap costs no layout because both glyphs are
  drawn at the button's own `size-icon-*` token: the root publishes one class
  and the icon and the spinner both read it. With no icon to take, the spinner
  is inserted as before. Only a bare `Icon` is swapped; a `Button.StartContent`
  wraps content of unknown height, and replacing one could resize the button.
  `resolveSpinnerSwapIndex` is the pure decision and is unit-tested.
- **`isLoading`** composes a `Spinner` in and blocks presses. Placement is
  `spinnerPlacement`: `start` (default), `end`, or `only` — which drops the
  children and centres the spinner in the footprint the button already has,
  carrying the label onto `accessibilityLabel` so a screen reader still has a
  name to read. `only` never squares the button on its own; pair it with
  `isIconOnly` when a square is what you want.
- **Loading is not disabled.** `isLoading` blocks the press and announces the
  button as *busy*, but keeps full contrast: the spinner already says the press
  landed, and dimming reads as "this control is unavailable". `isDimmedWhileLoading`
  opts into the faded treatment where a caller wants it.
- **A stretched button does not change width while loading**, because `only`
  keeps its footprint. In a *content-width* container — a `flex-row` — it still
  shrinks to the spinner, and that snap is un-animated on purpose: Pressable's
  `Animated.View` already runs a `useAnimatedStyle` on `opacity` and `transform`,
  and a native layout transition on the same view fights it for prop ownership.
  A caller who needs a stable width in a row pins it (`w-full`, `min-w-*`).
- **A definite width defeats `alignItems: stretch`.** A stretch-aligned child
  with a definite cross size resolves to cross-*start*, not centre — so any
  control that conditionally takes a fixed width inside a gap column jumps to
  the left edge unless it also sets `self-center`. This is what made an earlier
  `only` implementation collapse a full-width button into a small box flush
  left. Prefer not taking the width at all.

## Spinner

An animated loading indicator. Compound root plus `Spinner.Content`, the part
that rotates.

- **Sizes**: the icon scale, shared outright — `SPINNER_SIZES` *is*
  `ICON_SIZES`, `xs`…`2xl` (14/16/18/20/24/32pt) — or an explicit number. A
  spinner stands in for an icon, so the two must agree on what `md` means. **The root is the only sized box** — `Spinner.Content` is
  `size-full` and the arc carries no width or height at all, because
  react-native-svg resolves both to `'100%'` when neither is set. That
  `size-full` is load-bearing: content-size the middle layer and the percentage
  resolves against an indefinite parent, collapsing the glyph to zero.
  **Colours**: `default`, `success`, `warning`, `danger`, plus any token the
  theme emits (`primary-foreground`, `muted-foreground`) or a literal
  (`#EC4899`). A Tailwind palette name like `emerald-500` only resolves if some
  utility class already pulled that variable into the build — otherwise the
  token is unresolved and nothing is drawn. Prefer the semantic tokens.
- **Size and colour are inherited, not passed** — through exactly one path, the
  nearest `IconDefaultsProvider`, falling back to `md` on `foreground`. A
  `Button` already wraps the spinner it composes in with its own icon class and
  variant foreground, so the spinner does **not** read the button's context: a
  second path would recompute the same two values and could drift from them. An
  explicit `size` or `color` always wins — the precedence `Icon` follows.
- **Any child is the glyph**, wrapped in a `Spinner.Content` automatically so it
  still rotates — a custom icon or asset needs nothing but to be passed in.
  `Spinner.Content` is the rotating layer itself, so write it out by hand only
  when that layer needs styling.
- **`speed` belongs to the root**, not to `Spinner.Content`. It rides the
  spinner's context alongside the resolved size and colour, so every part of the
  spinner turns at one rate and a caller never reaches past the root to set it:
  `<Spinner speed={0.7}>` — 1 is one full turn per 900ms.
- **The default glyph is drawn from SVG primitives**, not a Central Icon — the
  set has no loader glyph. Rule 5 governs *icons*; primitives are fine.
- **The rotation sets `ReduceMotion.Never` deliberately.** Under the default
  `System` policy `withTiming` completes instantly while the OS reduce-motion
  setting is on, so `withRepeat(-1)` would spin a zero-length animation forever.
  A status indicator is not decorative motion.

## ListGroup

A surface grouping related rows. Compound root plus `ListGroup.Item` and its
five slots: `ItemPrefix`, `ItemContent`, `ItemTitle`, `ItemDescription`,
`ItemSuffix`.

- **Variants**: `default`, `secondary`, `tertiary`, `transparent`.
  **Sizes**: `sm`, `md`, `lg`. Size is not decoration — it drives the row
  metrics, the title and description type scale, both icon sizes *and* the
  divider inset, which is why those five numbers live in one axis rather than
  five magic values.
- **Dividers are inserted, not written out.** The root walks its children and
  puts a `Separator` between adjacent ones, inset to line up with the rows'
  padding. A `Separator` placed by hand suppresses the automatic one on either
  side of it, so a caller can make one gap full-bleed without turning the
  feature off; `isDivided={false}` turns it off entirely. `Children.toArray`
  drops the nulls a conditional child leaves behind, so a row rendered only
  some of the time does not strand a divider.
- **The root clips.** `overflow-hidden` is load-bearing: a pressed row fades to
  the edge of its own box, and the first and last rows would square off the
  group's corners without it.
- **A row is a `Pressable`.** `ListGroupItemProps` extends `PressableProps`, so
  `feedback`, `haptic`, `pressedScale` and the rest are inherited rather than
  restated — the row owns no vocabulary of its own. Only the default differs:
  `feedback` defaults to `fade`, because a full-bleed row that scales reads as
  the whole card flexing rather than as one row responding. A prop is only
  redeclared where it genuinely changes, as `Button` does with its narrower
  union; redeclaring one unchanged just to hang a doc comment on it puts a
  second definition in the tree that can drift.
- **Icons are composed, never passed as props.** `ItemPrefix` wraps its subtree
  in an `IconDefaultsProvider` carrying the `prefixIcon` slot — a step on the
  shared icon scale, like every other glyph in the library — and `foreground`, so a bare `<Icon icon={IconUser} />` needs nothing said at the
  call site. `ItemSuffix` draws a chevron when it has no children of its own;
  `iconProps` tunes that glyph and is ignored once it does.
- **String children** are wrapped in an `ItemContent` around an `ItemTitle`
  automatically, consecutive strings collapsing into one — the same rule, and
  the same reason, as `Button`.
- **Title colour goes on the title.** The `item` slot carries no `text-*`; a row is a `View` and cannot cascade colour to a `Text`. The tests
  assert this.

## Screen

A screen's frame: pinned chrome, a content region, and whatever scrolls between
them. Compound root plus `Screen.Navbar` (itself compound), `Screen.Content`,
`Screen.View`, `Screen.Header`, `Screen.Footer`, four scrollables, and the two
whole-screen states.

- **The navbar and footer measure themselves into a Reanimated context**, and
  every scrollable reserves exactly that. This is the whole point of the
  component: no screen carries a hand-tuned padding number that is right on one
  device and wrong on the next. The reserves are spacer *views* whose height is
  an animated style, not content-container padding — padding cannot animate on
  the UI thread, and the heights are only known after layout.
- **`placement`, not `variant`.** `overlay` (the default) floats the chrome over
  the content, which insets itself to match; `static` puts it in the flow. In
  this package `variant` always means a visual variant, so the axis that decides
  where a part *sits* gets its own name.
- **The footer's padding is a style, not a class**, and that is load-bearing.
  `footerOccupancy()` has to add the same band to a height measured at runtime,
  and a class is unreadable from JS. `SCREEN_FOOTER_PADDING` and
  `SCREEN_FLOATING_BOTTOM_GAP` therefore stay numbers in `screen.variants.ts`
  rather than joining the tokens in `tokens.css` — one constant drives both the
  render and the reserve, so they cannot drift. Do not "tidy" them into
  utilities.
- **Two occupancy numbers, differing by exactly the safe-area inset.**
  `footerOccupancy` is what the footer covers in list-content space and is the
  same in both keyboard states; `footerAboveKeyboard` is what it covers above an
  open keyboard and excludes the band the sticky shift parks behind it.
  Conflating them is a real bug — the derivation is in the block comment above
  them, and the tests pin both.
- **`Screen.ChatList` is a discriminated union on `variant`.** `legend`
  (default) takes chronological oldest-first data and LegendList's own
  `renderItem`; `flat` is an inverted `FlatList` with newest-first data and RN's.
  The two `renderItem` contracts genuinely differ, so each variant exposes its
  engine's own rather than adapting one into the other — an adapter would have to
  fabricate the `separators` object RN's signature promises, and nothing would
  honour it.
- **Seed a chat list with `composerBaseHeight`.** The footer publishes its real
  height a commit or two after the list's first layout, and the list has already
  scrolled to the end by then. Without the seed the newest message hides under
  the composer — intermittently, which is the worst kind of wrong.
- **`<Screen debug>` paints every layer.** Opt-in per screen and deliberately
  *not* gated behind `__DEV__`, so a reserve can still be inspected on a release
  build. The green occupancy band's edge must land on the footer's red one; a red
  sliver past it means the reserve is short. `SCREEN_DEBUG_COLORS` is exported so
  a composer can paint matching bands. These are raw `rgba()` literals rather
  than theme tokens on purpose — a debug layer in a semantic colour would be
  invisible against the surface it sits on.
- **Safe-area insets come from `useSafeAreaInsets()`, never from uniwind's
  `*-safe` utilities.** `pt-safe` and friends compile to
  `env(safe-area-inset-top)`, which resolves to **zero** on React Native — the
  class applies, nothing moves, and a navbar draws over the status bar with no
  error anywhere. Verified on a simulator, not assumed. The hook is also the
  source the footer's occupancy maths already reads, so a container's inset and
  the reserve computed against it cannot disagree. `resolveScreenEdgePadding`
  turns an `insets` prop into a style object.
- **A `static` footer is opaque; an `overlay` footer is not.** The backing lives
  INSIDE the sticky view so it travels with the keyboard translation — put it on
  the positioned outer view instead and a static footer lifted over the content
  lets that content show straight through it, its buttons legible only where
  they happen to overlap blank space. An overlay footer stays transparent on
  purpose: content is meant to scroll under it, and whatever the caller puts
  inside brings its own surface.
- **Both hairlines are drawn at rest**, and `fadeBorderOnScroll` — the same prop
  name on `Screen.Navbar` and `Screen.Footer` — opts into a scroll-linked ramp
  instead. The two read **opposite ends of the scroll**: the navbar's answers
  "is there content above?" and brightens as you leave the top, while the
  footer's answers "is there content below?" and fades out as the content runs
  out. A footer line driven by `scrollY` would be brightest exactly where there
  is nothing left to scroll to. One `SCREEN_BORDER_FADE_DISTANCE` drives both,
  because two numbers that should always agree are two numbers that can drift.
- **A worklet cannot rely on a module-scope helper.** `resolveNavbarBorderOpacity`
  and `resolveFooterBorderOpacity` write their `Math.min(1, Math.max(0, …))`
  clamp out separately rather than sharing one. Factoring it into a `clampUnit`
  helper — itself marked `"worklet"` — crashed the UI thread with `undefined is
  not a function`: it was not captured into the worklet's closure. No unit test
  sees it, because on the JS thread the helper resolves perfectly. Keep a
  worklet's body self-contained.
  That default is the way round it is because a screen whose content starts
  flush against the chrome wants the line from the first frame — with the fade
  always on, screens re-added a border by hand, which is the signal the default
  was wrong. Both ramps are written out rather than calling Reanimated's
  `interpolate`, so they stay reachable from `bun test`, and both clamp at each
  end because a rubber-banded overscroll reports a negative offset.
- **There is no `Navbar.Action`.** `Button` already owns that vocabulary —
  loading swap, icon inheritance, haptics, accessibility — so a navbar action is
  written as `<Button isIconOnly size="sm" variant="secondary">`. A second
  definition of props a component does not change is one that can drift.
- **`Screen.Navbar.BackButton` takes an `onPress`.** This library has no
  navigation dependency and must not gain one for a chevron. The app wires
  `router.back()`. `Screen.Footer`'s `isFocused` prop is the same trade: an app
  with a router passes `useIsFocused()`, and without one the footer behaves as
  focused.
- **The root lives in `screen-root.tsx`, not `screen.tsx`.** `Screen.Loading`
  and `Screen.Error` are whole screens — they render the root — so putting it in
  the file that runs the `Object.assign` naming them would close a cycle. This is
  rule 3 applied inside a folder.
- **A nested `<Screen>` passes the outer context through** rather than shadowing
  it, so `Screen.Loading` returned from inside a screen does not start a second,
  unread set of measurements.
- **Two optional peers.** `react-native-keyboard-controller` and
  `@legendapp/list` are `peerDependenciesMeta.optional`, so an app that never
  imports `Screen` never resolves them.
- **The app must mount `SafeAreaProvider` → `KeyboardProvider` →
  `<KeyboardStateSync />`.** That last one is not optional polish:
  `KeyboardProvider` owns exactly one pair of shared animation values for the
  whole app, and on iOS they are written only from the `will` events. Any
  teardown that skips one — an interactive dismiss interrupted by navigation, a
  stack pop, an app suspend — pins them open app-wide, and every screen then
  renders "keyboard open" over a keyboard that is not there. `Screen.Footer` runs
  the same repair on mount as a backstop.

## Text

The library's type scale, and the one component that reproduces React Native's
own text inheritance through classNames. Compound root plus twelve presets:
`Display`, `Title`, `Header`, `Subheader`, `Paragraph`, `Label`, `Caption`,
`Overline`, and the four inline ones — `Strong`, `Emphasis`, `Link`, `Code`.

- **Every `Text` publishes its resolved class to its subtree**, and merges the
  one it inherited. Natively a nested `<Text>` inherits the parent's *style
  object* and overrides only the keys it sets; Uniwind compiles each `className`
  independently, so the parent's resolved class has to be threaded through and
  beaten per-axis instead. `resolveTextClass` is that chain, weakest first:
  `TEXT_BASE_CLASS`, the inherited class, this text's named axes, the caller's
  `className`. It is the ladder `resolveIconSizeClass` already follows.
- **`textVariants` has no `defaultVariants`, and must not gain any.** An axis the
  caller did not name has to emit *nothing* so it falls through to the enclosing
  text's class — that fall-through is the whole feature. A default would emit
  from inside the same call, ahead of the inherited class in the merge, and every
  nested `Text` would snap back to it. `iconVariants` carries the same rule for
  the same reason. The fallback lives in `TEXT_BASE_CLASS` instead.
- **`TEXT_BASE_CLASS` is applied unconditionally**, never guarded behind "am I
  nested". Under true nesting it is a no-op — the parent's string already names
  every axis, so tailwind-merge drops it. It only does work under a *partial*
  provider, a `Button` publishing nothing but `text-primary-foreground`, where
  guarding it would leave a nested `Text` with a colour and no size at all,
  collapsing to React Native's own 14pt default.
- **The correctness property is a fixpoint**: for every class this resolver can
  produce, a nested `Text` with no props of its own resolves to *exactly* its
  parent's string, at any depth. The tests assert it across the matrix. Anything
  that breaks it makes inheritance lossy in a way only a screen would reveal.
- **A variant names type, never a line height.** tailwind-merge lists `leading`
  among `font-size`'s conflicting groups, so a `text-lg` from the `size` axis
  silently deletes a `leading-6` written beside a `text-base` — no error, just a
  paragraph that loses its leading when someone resizes it. Tailwind v4's
  `--text-*--line-height` companions survive `tokens.css`'s size-only overrides,
  so every step already carries a paired leading. Prose needing its own gets a
  `--text-paragraph` / `--text-paragraph--line-height` **pair**, registered in
  `tokens.ts` — one utility carrying both.
- **`color` is page-level only — no `-foreground` family.** `X-foreground` means
  "content drawn on an `X` surface" (rule 10), and mapping a surface variant to
  its foreground is already each surface component's job
  (`BUTTON_FOREGROUND_TOKEN`, `LIST_GROUP_FOREGROUND_TOKEN`). A second copy of
  that map here could drift from it. Text on a coloured surface writes the
  utility in a `className`.
- **`align` is `left`/`center`/`right`, never `start`/`end`.** React Native's
  `textAlign` accepts `auto | left | right | center | justify` and nothing else,
  so Tailwind v4's logical-property utilities resolve to a value RN rejects.
  `transform: "none"` emits `normal-case` rather than an empty string, so it can
  actually clear an `Overline`'s `uppercase`.
- **A nested `Text.Code` cannot be padded.** A nested `<Text>` is laid out by the
  platform's text engine — an `NSAttributedString` run on iOS, a `Span` on
  Android — and both ignore padding, margin and border radius on an inner
  `<Text>`. Only the background survives. The compound variant applies the pill
  treatment to the standalone case only; a code *block* is a `View` the caller
  wraps around it.
- **Anything can publish into the cascade, not just a `Text`.** `Button` wraps
  its children in a `TextClassProvider` carrying the label's treatment beside the
  `IconDefaultsProvider` it already renders, so a bare `<Text>` composed into one
  needs nothing at the call site — the payoff `Icon` already had. Publish a
  treatment only where **one** covers the whole subtree: a `ListGroup` row
  (title + description), a navbar (title + subtitle) and `Screen.Error` (title +
  message) each carry two, and one provider cannot serve both, so their parts
  keep per-part classes.
- **It renders `Animated.Text`.** Animated text styles work anywhere with no
  opt-in, at the cost of a Reanimated wrapper per text node. If a long list ever
  profiles badly, the escape hatch is to base the root on RN's `Text` and let app
  code write `<Animated.Text className={useTextClass()} style={…} />` — the
  cascade is on context, so that inherits correctly. Measure first.
- **OS font scaling is respected and capped.** `allowFontScaling` is left at
  React Native's default; `maxFontSizeMultiplier` defaults to
  `TEXT_MAX_FONT_SIZE_MULTIPLIER`. The cap exists for the fixed-height chrome —
  `h-button-*` and `h-navbar-row` cannot grow, so an uncapped multiplier clips a
  label rather than enlarging it. Both stay overridable per call site.
- **No `asChild`.** `Slot` throws on a non-element child and a `Text`'s child is
  usually a string, so it would be unusable in the shape people would reach for.
  There is also nothing to donate: `useTextClass()` hands the class over directly.

## Separator

A one-pixel rule, hidden from assistive technology — a line between every row
carries nothing a screen reader can use, and announcing them buries the rows.

- **`separatorVariants` lives in `separator.tsx`**, above the component, not in a
  `*.variants.ts` sibling — the pattern C carve-out. That file imports React
  Native, so the `tv()` is not reachable from `bun test`; the exclusive-axis and
  `self-stretch` rules below are stated in its doc comment instead of asserted.
- **Orientations**: `horizontal` (default), `vertical`.
- **The long axis is `self-stretch`, never `w-full` / `h-full`.** Yoga resolves
  a percentage length against the parent's content box and then adds the
  margins on top, so an inset `w-full` line starts 16pt in and runs 16pt past
  the far edge — a gap down one side and none down the other. Stretching
  subtracts the margins instead, which is what an inset divider needs. Do not
  "fix" this back to a percentage width.
- **A filled box, not a border**, so a caller insets it with a plain `mx-*`
  without fighting a border's own box model. This is how `ListGroup` positions
  the dividers it inserts.

## Pressable

- **`pressable.variants.ts` holds no `tv()`, on purpose.** Its values are
  opacity and scale *interpolation targets* read by a worklet on the UI thread
  (`1 - pressed.value * (1 - targetOpacity)`), not styles. A worklet cannot
  compile a className, so `tv` is the wrong tool here — a deliberate exception
  to pattern C, not an oversight.
- **`feedback` is the shared vocabulary**: `scale`, `fade`, `scale-fade`,
  `none`, defined once in `pressable.variants.ts`. Every pressable in the
  library resolves through it rather than keeping a private map — `Button`
  narrows it, `ListGroup.Item` forwards it whole.
- **`scale-fade` is composed, not spelled out.** Its scale comes from `scale`
  and its opacity from `fade`, so tuning either single-axis mode carries
  through and the name keeps describing what the mode does. A test asserts it.
- **`pressedScale` / `pressedOpacity` win on the axis they name**, and leave the
  other to `feedback`. They are the escape hatch for a value the named modes do
  not cover, not an alternative API — `??` is the merge, so an explicit `0` is a
  value rather than an absence.
- **The no-feedback fallback is unnamed on purpose.** A bare `Pressable` presses
  to `{ opacity: 0.9, scale: 0.97 }`, which fades less than `fade` does. Naming
  it would either change what a bare pressable has always done or force
  `scale-fade` to fade less than `fade`.
- **`disabled` vs `busy`.** Both block the gesture; only `disabled` announces
  the control as disabled. Use `busy` for a temporary state the component clears
  itself, so assistive tech reports a control that is momentarily unavailable
  rather than one that is inert. Neither applies any opacity — that is the
  caller's variant's job.
- **A worklet crosses back to JS with `scheduleOnRN`**, imported from
  `react-native-worklets` — never Reanimated's `runOnJS`, which since Reanimated 4
  is a deprecated shim that forwards to exactly that call. `scheduleOnRN(fn, ...args)`
  takes the arguments itself, so there is no second call: `runOnJS(onPress)()`
  becomes `scheduleOnRN(onPress)`. The same rename covers `runOnUI` →
  `scheduleOnUI`, which `use-keyboard-state-sync` already uses. A Biome
  `noRestrictedImports` rule in `@delacour/biome-config` fails the build on the
  deprecated names, so this cannot regress quietly.

## Sizing

**An icon's size is a class, and it drives the glyph's `size` prop — not a
style.** That indirection is forced, not stylistic. `CentralIconBase` spreads
its props onto `<Svg>` *before* setting its own `width`/`height` from `size`,
and `react-native-svg`'s `Svg.render()` then merges `{...style, ...props}` (props
win) and pushes the width/height-derived styles onto the root **last**. A
`size-4` that resolved to `style.width` is overridden every single time.

So `icon.tsx` runs the class through `withUniwind` in manual mode to recover the
width and hands that number to the glyph:

```tsx
const StyledIconGlyph = withUniwind(IconGlyph, {
	size: { fromClassName: "className", styleProperty: "width" },
});
```

`withUniwind` is called at **module scope**. In render it would mint a new
component type every frame and remount the icon.

**Precedence, weakest source first.** The first four are one `cn()` chain, so the
last `size-*` wins; the fifth is a different mechanism entirely, which is what
makes "inherited class plus caller-supplied number" resolve correctly.

| Source | How it wins |
| --- | --- |
| `ICON_FALLBACK_SIZE_CLASS` | first in the chain |
| the enclosing `IconDefaultsProvider`'s `className` | second |
| a named `size="lg"` | third |
| the caller's `className` | last in the chain |
| a numeric `size={18}` | **bypasses the chain** — `withManualUniwind` skips its mapping when the target prop is already defined |

`resolveIconSizeClass` builds that chain, and `resolveSpinnerRootClass` does the
same for a spinner's root. Both are pure, so the whole ladder is reachable from
`bun test`.

**A numeric size can never become a class.** Tailwind's scanner is static, so a
runtime `` `size-[${n}px]` `` is never compiled and Uniwind's store has nothing to
look up — it would silently draw nothing. Named sizes are classes; the numeric
escape hatch stays a prop (`Icon`) or an inline `style` (a `Spinner` root, which
drops its size class entirely in that case rather than leaving a loser behind).

**Overriding through `className` uses `size-*`, not `w-*` with `h-*`.**
tailwind-merge conflicts `size` into `w`/`h` but not the reverse, so a trailing
`w-6` will not clear a leading `size-5`.

**Sizes are semantic tokens, not raw utilities.** `tokens.css` owns the values
in Tailwind's own namespaces, so they compile to ordinary utilities:

| Token | Utility | What it sizes |
| --- | --- | --- |
| `--spacing-button-*` | `h-button-md`, `w-button-md` | a button's height, and its square footprint when icon-only |
| `--spacing-icon-*` | `size-icon-md` | any glyph — `Icon`, `Spinner`, a row's chevron |
| `--text-button-*` | `text-button-md` | a button's label, paired with its height |
| `--spacing-navbar-row` | `h-navbar-row` | the navbar's control row, without its safe-area band |
| `--spacing-screen-gutter` | `px-screen-gutter` | the gutter `Screen.Header`, `Screen.Navbar` and content share |

**`Icon` and `Spinner` share one scale.** `SPINNER_SIZES` *is* `ICON_SIZES`, so
`size="md"` is the same edge length in both and one can stand in for the other
with nothing moving. A component indexes that scale at its own step name rather
than restating a number: a button's `sm`/`md`/`lg` icon is
`icon-sm`/`icon-md`/`icon-lg`. That is what makes the button's loading swap
free — see **Button**.

A token is named for what it sizes, not for an abstract category: only `Button`
uses the `button-*` scale today, so calling it that keeps the name honest. A
future control that genuinely shares these heights gets its own namespace rather
than borrowing this one — `--spacing-input-*` reading `h-button-md` would be
worse than one more scale.

**Adding a token means editing two files.** Put the value in `tokens.css` and
the name in `src/styles/tokens.ts`. Miss the second and tailwind-merge stops
recognising the utility, so a caller's override quietly stops working;
`tokens.test.ts` asserts the two lists match, and reads the CSS to check the
scale still ascends.

## Theming

Tokens are CSS variables under `@variant light` / `@variant dark` in
`src/styles/theme.css`. Components reference semantic names — `bg-background`,
`text-muted-foreground` — and never a raw palette colour or a `dark:` prefix;
the variable swap handles the theme. For a prop that needs a colour *value*
rather than a class (an icon's `color`, a gradient stop), use `useThemeColor`.

**An icon's size is a class; an icon's colour is a token.** The asymmetry is
deliberate. Tailwind's spacing scale genuinely owns 14/16/18/20/22/24/32, so a
class is the better name for them. A colour class cannot express a literal
(`#EC4899`) or reach an SVG paint prop like a gradient's `stopColor`, and
`useThemeColor` already covers both — so a colour-class path would leave two
colour systems in the package rather than replacing one.

## Testing

`bun test` covers **pure logic only**: `cn`, `mergeProps`, `composeRefs`, and
the `tv()` variant functions. It cannot render components — React Native ships
Flow-typed source that Bun's transpiler cannot parse, and
`@testing-library/react-native` needs a Jest transform. This is why a slotted
variant definition lives in a `*.variants.ts` file free of React Native imports.

`separatorVariants` is the deliberate exception. It sits in `separator.tsx`, so
`bun test` cannot reach it and its class strings are asserted nowhere — the
reasoning lives in its doc comment and the behaviour is checked on a simulator.
A new single-element component that colocates its `tv()` takes the same trade.
A component with parts, or with a pure resolver, does not get to make it.

Rendering is verified in `apps/playground` on a simulator. If render tests
become necessary, add `jest-expo` to the playground rather than to this package.

This is also why a component's pure decisions belong in its `*.variants.ts`
rather than inline in the `.tsx` — `resolveButtonLayout`, `resolveIconSizeClass`
and `resolveSpinnerRootClass` live there so the whole matrix is reachable from
`bun test`.

## Adding a component

1. `src/components/{name}/{name}.tsx`, plus an `index.ts` re-exporting the
   component and its types. A component with more than one styled part, or with
   a pure resolver, adds a `{name}.variants.ts` for its slotted `tv()`; a single
   styled element declares the `tv()` in its own file instead. A
   compound component adds one file per part, a `{name}.context.tsx` and a
   `{name}.types.ts` — see **Compound component layout**.
2. Build interaction on `Pressable` — never on a bare `TouchableOpacity`.
3. Write the variant tests first where there is a `{name}.variants.ts` — that is
   the part `bun test` can reach. A colocated `tv()` has none, so state its rules
   in the doc comment and verify them on a simulator at step 5.
4. `bun run gen-exports`.
5. Render it in `apps/playground/src/app/(components)/{name}.tsx`, add a row for
   it to the `ListGroup` on `src/app/index.tsx`, and check it on a simulator.

## Compound component layout

One file per part. `button.tsx` holds the root and nothing else the parts need,
`button-label.tsx` holds `Button.Label`. The point is navigability: a part has a
path of its own rather than a line number in a 270-line file.

The root file ends with a single `Object.assign` naming every slot:

```tsx
function ButtonRoot({ … }: ButtonProps): ReactElement { … }

/**
 * Full doc comment, with @example blocks, lives HERE — on the const.
 */
export const Button = Object.assign(ButtonRoot, {
	/** One line per slot. This is what hovering `<Button.Label>` shows. */
	Label: ButtonLabel,
	StartContent: ButtonStartContent,
	EndContent: ButtonEndContent,
	displayName: "Button",
});
```

Five things about that block are load-bearing:

1. **The root must be a `function` declaration.** Passing a function
   *expression* to `Object.assign` takes it off React Compiler's known-HOC list,
   and the component is dropped from compilation silently — no warning, the
   memoization simply disappears.
2. **The doc comment goes on the `const`, never on `XRoot`.** A doc left on the
   private root hovers as empty at the call site; the `@example` blocks are lost.
3. **Per-slot one-liners are the reason to prefer `Object.assign`** over
   `Button.Label = ButtonLabel`. They surface on hover at `<Button.Label>`,
   where the trailing-assignment form showed nothing.
4. **`displayName` is required.** React DevTools reads `displayName || name`, so
   without it every tree row, error stack and profiler entry reads `ButtonRoot`.
   It must sit inside the object or on the root *before* the assign —
   `Button.displayName = …` afterwards is a type error.
5. **A slot may not be named `name`, `length`, `caller` or `arguments`.** Those
   are non-writable on a function and `Object.assign` throws at module init.

**One carve-out: a part that is a pure preset lives in the root file.** A part
naming a variant and nothing else — reading no context, holding no logic, no
state — has nothing to navigate *to*, so a file of its own would be folder weight
without the payoff this rule exists for. `Text` is the one that qualifies today:
its twelve presets are `function` declarations in `text.tsx`, each with its own
doc comment, and it needs no shared-implementation leaf because there are no part
files to close a cycle with. A part that calls a `useXPart` hook or wraps its own
children — `Button.Label`, `ListGroup.Item` — does **not** qualify. Do not
"tidy" `Text`'s presets into twelve files.

Helpers follow their caller, not the root: `wrapTextChildren` lives in
`list-group-item.tsx` because `ListGroup.Item` wraps its own bare text, while
`withDividers` stays in `list-group.tsx` because the root inserts the dividers.
Putting a part's helper in the root file closes a cycle.

`{name}.types.ts` holds **only** prop types shared by two or more modules in the
folder (`ButtonSlotProps`, `ListGroupSlotProps`, `ListGroupTextProps`). A type
with exactly one consumer stays in that consumer's file.

Parts are exported from their own module so the root can import them, but are
**not** re-exported from `index.ts` — the public surface stays the root, its prop
types, its context and its variants. Nothing outside reaches past the index.

## Consuming from an app

```css
/* app global.css — use the real workspace path, not a node_modules path:
   Bun symlinks workspace packages and Tailwind's scanner cannot follow
   symlinks, so classes would be silently dropped from production builds. */
@import '@delacour/native-ui/styles';
@source '../../../../packages/native-ui/src';
```

`Screen` additionally needs three providers above it, outermost first:

```tsx
import { KeyboardStateSync } from "@delacour/native-ui/hooks/use-keyboard-state-sync";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

<SafeAreaProvider>
  <KeyboardProvider>
    <KeyboardStateSync />
    {children}
  </KeyboardProvider>
</SafeAreaProvider>;
```

`KeyboardStateSync` is required, not optional — see **Screen** for what breaks
without it.

```tsx
import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight } from "@delacour/native-ui/icons/central";

// The icon inherits the button's size and its variant's colour.
<Button haptic="selection" onPress={next}>
  <Button.Label>Continue</Button.Label>
  <Icon icon={IconArrowRight} />
</Button>;

<Button accessibilityLabel="Favourite" isIconOnly variant="ghost">
  <Icon icon={IconHeart} />
</Button>;
```

The package ships raw `.tsx`; there is no build step. Uniwind's transform runs
in the consuming app's Metro pipeline, so a precompiled build would arrive after
that transform with its classNames already dead.
