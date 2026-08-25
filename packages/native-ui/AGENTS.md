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
│   ├── badge/
│   │   ├── index.ts              → @delacour/native-ui/badge
│   │   ├── badge.tsx             Root + the Object.assign compound surface
│   │   ├── badge-label.tsx       Badge.Label
│   │   ├── badge-start-content.tsx  Badge.StartContent
│   │   ├── badge-end-content.tsx    Badge.EndContent
│   │   ├── badge-close-button.tsx   Badge.CloseButton, the dismiss pressable
│   │   ├── badge.context.tsx     BadgeContext, useBadge(), useBadgeContext(), useBadgePart()
│   │   ├── badge.types.ts        Prop types shared by two or more parts
│   │   ├── badge.variants.ts     Pure tv() slots + resolveBadgeInteractive, no RN imports
│   │   └── badge.variants.test.ts
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
│   ├── checkbox/
│   │   ├── index.ts              → @delacour/native-ui/checkbox
│   │   ├── checkbox.tsx          Root + the Object.assign compound surface
│   │   ├── checkbox-label.tsx    Checkbox.Label, the Text.Label inside the tap target
│   │   ├── checkbox-group.tsx    Checkbox.Group, which owns the checked list
│   │   ├── checkbox-box.tsx      The square, its animated border, fill and tick — internal
│   │   ├── checkbox.context.tsx  CheckboxContext and CheckboxGroupContext, with their hooks
│   │   ├── checkbox.types.ts     Prop types shared by two or more parts
│   │   ├── checkbox.variants.ts  Pure tv() slots + six resolvers, no RN imports
│   │   └── checkbox.variants.test.ts
│   ├── field/
│   │   ├── index.ts              → @delacour/native-ui/field
│   │   ├── field.tsx             Root + the Object.assign compound surface
│   │   ├── field-set.tsx         Field.Set
│   │   ├── field-legend.tsx      Field.Legend
│   │   ├── field-group.tsx       Field.Group
│   │   ├── field-content.tsx     Field.Content
│   │   ├── field-label.tsx       Field.Label
│   │   ├── field-description.tsx Field.Description
│   │   ├── field-error.tsx       Field.Error
│   │   ├── field-separator.tsx   Field.Separator
│   │   ├── field.context.tsx     FieldProvider, useField(), useFieldPart()
│   │   ├── field.types.ts        Prop types shared by two or more parts
│   │   ├── field.variants.ts     Pure tv() slots + resolvers, no RN imports
│   │   └── field.variants.test.ts
│   ├── icon/
│   │   ├── index.ts              → @delacour/native-ui/icon
│   │   ├── icon.tsx              Icon, and the one withUniwind wrapper (see rule 6)
│   │   ├── icon.context.tsx      IconDefaults, IconDefaultsProvider, useIconDefaults()
│   │   ├── icon.variants.ts      Pure tv() + the size-class ladder, no RN imports
│   │   └── icon.variants.test.ts
│   ├── input/
│   │   ├── index.ts              → @delacour/native-ui/input
│   │   ├── input.tsx             Root + the Object.assign compound surface
│   │   ├── input-group.tsx       Input.Group, plus its own nested surface
│   │   ├── input-group-decorator.tsx  The shared body behind both decorators
│   │   ├── input-group-prefix.tsx     Input.Group.Prefix
│   │   ├── input-group-suffix.tsx     Input.Group.Suffix
│   │   ├── input.context.tsx     InputGroupProvider, useInputGroup(), useInputGroupPart()
│   │   ├── input.types.ts        Prop types shared by two or more parts
│   │   ├── input.variants.ts     Pure tv() slots + resolvers, no RN imports
│   │   └── input.variants.test.ts
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
│   ├── provider/
│   │   ├── index.ts              → @delacour/native-ui/provider
│   │   └── provider.tsx          DelacourProvider — the app's root layer stack
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
│   ├── slider/
│   │   ├── index.ts              → @delacour/native-ui/slider
│   │   ├── slider.tsx            Root + the Object.assign compound surface
│   │   ├── slider-output.tsx     Slider.Output, the Text.Label readout
│   │   ├── slider-track.tsx      Slider.Track — owns the pan, the measurement, the haptic
│   │   ├── slider-fill.tsx       Slider.Fill
│   │   ├── slider-thumb.tsx      Slider.Thumb, and the whole accessibility surface
│   │   ├── slider.context.tsx    SliderContext, useSlider(), useSliderContext(), useSliderPart()
│   │   ├── slider.types.ts       Prop types shared by two or more parts
│   │   ├── slider.variants.ts    Pure tv() slots + the geometry worklets, no RN imports
│   │   └── slider.variants.test.ts
│   ├── spinner/
│   │   ├── index.ts              → @delacour/native-ui/spinner
│   │   ├── spinner.tsx           Root + the Object.assign compound surface
│   │   ├── spinner-content.tsx   Spinner.Content, the rotating layer
│   │   ├── spinner-arc.tsx       The default arc glyph
│   │   ├── spinner.context.tsx   SpinnerContext, useSpinner(), useSpinnerContext()
│   │   ├── spinner.variants.ts   Pure tv() slots + resolvers, no RN imports
│   │   └── spinner.variants.test.ts
│   ├── switch/
│   │   ├── index.ts              → @delacour/native-ui/switch
│   │   ├── switch.tsx            Root — owns the pan, the state and the track
│   │   ├── switch-thumb.tsx      Switch.Thumb, the knob and its one animated style
│   │   ├── switch-content.tsx    The shared body behind both content layers
│   │   ├── switch-start-content.tsx  Switch.StartContent
│   │   ├── switch-end-content.tsx    Switch.EndContent
│   │   ├── switch.context.tsx    SwitchContext, useSwitch(), useSwitchContext(), useSwitchPart()
│   │   ├── switch.types.ts       Prop types shared by two or more parts
│   │   ├── switch.variants.ts    Pure tv() slots + the release worklet, no RN imports
│   │   └── switch.variants.test.ts
│   └── text/
│       ├── index.ts              → @delacour/native-ui/text
│       ├── text.tsx              Root, all twelve presets, the Object.assign surface
│       ├── text.context.tsx      TextClassProvider, useTextClass()
│       ├── text.variants.ts      Pure tv() + resolveTextClass, no RN imports
│       └── text.variants.test.ts
├── expo/             Expo-only entry points — navigation-theme
├── hooks/            use-controllable-state, use-theme-color, use-keyboard-state-sync
├── icons/central.ts  Central Icons re-export
├── lib/              cn, tv, merge-props, compose-refs, slot, keyboard-animation
├── styles/           index / base / tokens / theme CSS, plus tokens.ts
├── display-name.test.ts  The package-wide displayName check — see rule 12
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
4. **Anything importing an Expo package lives in `src/expo/`.** That directory
   is the one place a framework dependency is allowed, and the import path says
   so: `@delacour/native-ui/expo/navigation-theme`. Everything under it depends
   on an **optional** peer, which is what the granular exports make safe — an
   app that never imports `./expo/*` never resolves them, and one on a
   different navigator keeps the rest of the library.

   Elsewhere the no-framework rule still holds. `useNavigationTheme` returns
   plain colour values from `src/hooks/`, and only the component that feeds them
   to `ThemeProvider` sits under `expo/`. That split is deliberate: the values
   are useful to any navigator, and `Screen.Navbar.BackButton` still takes an
   `onPress` rather than calling a router.

5. **Central Icons only**, via `@delacour/native-ui/icons/central`.
6. **Run `bun run gen-exports`** after adding or removing a component folder or
   a file under `src/expo`, `src/hooks`, `src/lib`, or `src/icons`. Never hand-edit the
   `exports` map. A component folder without an `index.ts` fails the script.
7. **Never wrap a React Native or Reanimated component with `withUniwind`.**
   `View`, `Text`, `Pressable`, `Animated.View` and friends already accept
   `className`. `withUniwind` is only for third-party components (`expo-image`,
   `expo-blur`), and a given component may only be wrapped once, in one file.

   *Central Icons is the one carve-out, and it is already spent.* `icon.tsx`
   wraps a local `IconGlyph` proxy that takes the glyph as **data**, so a single
   wrapper covers the whole two-thousand-icon set instead of one per glyph —
   still one component wrapped once, in one file. Do not wrap a Central Icon
   directly, do not wrap the proxy anywhere else, and do not add a second
   wrapper for `Svg`. See **Sizing** for why the wrapper has to exist at all.
8. **Native modules are peer dependencies, never dependencies.** Two copies of
   a native module register twice and break at runtime.
9. **`cn()` for every caller-supplied `className`, and `tv` from `lib/tv`.**
   Uniwind does not deduplicate conflicting utilities on its own. There are
   **two** mergers here and both need the semantic size tokens: `cn()` merges a
   caller's className, and `tv()` merges slots and variants through a
   tailwind-merge instance of its own. Never import `tv` from
   `tailwind-variants` directly — a bare `tv` does not know what `button-md`
   is, drops `text-button-md` into tailwind-merge's text *colour* group, and
   silently strips the label's colour. `src/styles/tokens.ts` holds the one
   config both are built from.
10. **No `any`.** Discriminated unions over loose types.
11. **Token names diverge from the web package where the mobile kit needs
    them to.** This package uses `danger` / `danger-soft` (matching the button
    variant names) and adds `tertiary`, where the web package uses
    `destructive`. `X-foreground` always means "content drawn on an `X`
    surface" — keep that meaning when adding a token.
12. **Every component carries a `DelacourUI.`-prefixed `displayName`.** Not just
    compound roots — every part, every context provider, every internal leaf that
    renders. React DevTools reads `displayName || name`, so an unnamed component
    shows its private symbol (`ScreenNavbarTitle`) in every tree row, error stack
    and profiler entry instead of its place in the API
    (`DelacourUI.Screen.Navbar.Title`). The derivation and the two legal
    assignment forms are in **Compound component layout**;
    `src/display-name.test.ts` fails the build with the name of any component
    that lacks one.

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

## Input

A text field, and the box that can hold content beside it. Root plus
`Input.Group` and its two decorators, `Prefix` and `Suffix`.

- **Variants**: `primary`, `secondary`. **Sizes**: `sm`, `md`, `lg` — the box
  height, the value's type scale and a decorator's icon step, on one axis.
- **The box is one slot with two homes, and that is the whole design.** The
  `root` slot of `inputVariants` lands on the `TextInput` when a field stands
  alone and on `Input.Group`'s row when it does not. `resolveInputFieldClass` is
  the decision, and it is pure, so `input.variants.test.ts` sweeps the entire
  matrix and asserts that every chrome utility a lone field wears is present on
  the group's row. A grouped field is therefore the *same* box rather than a
  similar one. **Do not give `Input.Group` a border, background or height of its
  own** — a second class string is a second thing that can drift, and the drift
  would be a one-pixel difference nobody notices until it is shipped.
- **The group owns the axes, because it owns the box.** `variant`, `size`,
  `isInvalid` and `isDisabled` live on `Input.Group`, and an `Input` inside one
  reads them from context — the same way a `ListGroup.Item` takes no `variant`.
  The field's own copies of those props are ignored while it is grouped. One box,
  one set of axes; two would be two answers to the same question.
- **The two state axes have three sources, and the nearest wins:**
  `Input.Group` → the `Input`'s own prop → the enclosing `Field`. An `Input`
  inside `<Field isInvalid>` turns danger with nothing said at the call site, and
  `<Input isInvalid={false} />` opts that one control out. `Input.Group` reads
  the `Field` too, or a decorated field inside an invalid one would stay calm
  while its label went red. Both are `??` chains, so an explicit `false` is a
  value rather than an absence — the rule `pressedScale` already follows.
- **Uniwind bridges the three colour *props*, so rule 7 is untouched.** A
  `TextInput`'s placeholder, caret and selection take a colour value, not a
  style, and uniwind's own `TextInput` — which is what a plain
  `import { TextInput } from "react-native"` resolves to, via its Metro
  resolver — accepts a className for each and compiles it to `styles.accentColor`.
  So this component wraps nothing in `withUniwind`, and the `Icon` carve-out
  stays spent exactly once.
- **Those classNames must be `accent-*` utilities.** `accent-muted-foreground`,
  never `text-muted-foreground`. Uniwind reads only `accentColor` off the
  compiled class, so anything else resolves to nothing: it warns once in
  development and leaves the prop undefined, which renders as the platform
  default rather than as an error. The defaults live in `input.variants.ts`.
- **`placeholderTextColorClassName` is `Omit`ed from `InputProps`.** Uniwind's
  name and ours would otherwise both reach the same colour, and a caller setting
  one while the component set the other is a bug with no error attached.
  `selectionColorClassName` keeps uniwind's name because it already is the name
  this package would have chosen; only its default is supplied here.
- **Focus is React state, not a `focus:` class.** Uniwind's `TextInput` does
  track its own focus, and `focus:border-ring` would work on a lone field — and
  do nothing at all for the box `Input.Group` draws around a grouped one, since a
  `View` cannot see a sibling's focus. One state, read by an `isFocused` variant,
  keeps the two identical and puts the decision somewhere `bun test` can reach.
- **Invalid outranks focus.** A field that went grey the moment it was tapped
  would drop the only signal it has that its value is wrong, exactly while the
  value is being corrected. The border, the caret and the decorators all stay
  danger.
- **A multiline field turns its height into a floor**, and the row aligns to the
  top with it — centred decorators would drift down the side of a paragraph
  instead of sitting on its first line. `py-0` on the single-line branch is
  load-bearing on Android, where the platform's own vertical padding would
  otherwise push the value off centre inside a fixed height.
- **Prefix and suffix share one `decorator` slot and one implementation.** They
  are the same box in different places — the row's `gap` is what separates
  them — so a second identical slot would only be a second thing to keep in step.
  `input-group-decorator.tsx` is the shared leaf; the two part files name it.
- **A decorator wraps bare text in a `Text`.** `<Input.Group.Prefix>$</...>` is
  the shortest thing anyone will write and React Native cannot render a string
  outside a `<Text>`, so it would crash. Consecutive strings collapse into one —
  the same rule, and the same reason, as `Button`.
- **Pressing the group focuses the field.** A lone field is its own tap target
  edge to edge; a grouped one only covers the middle of the box, so the group is
  a `Pressable` with `feedback="none"` whose press focuses the field through the
  ref it shares on context. A `Button` inside a decorator still receives its own
  press.
- **There is no `Input.Label`, `Input.Description` or `Input.ErrorMessage`.**
  `Text.Label` and `Text.Caption` already are those, and a label defined twice is
  a type scale that can drift. `apps/playground`'s `/input/form` is what the
  trade looks like at a call site.
- **`--spacing-input-*` is its own scale**, matching `--spacing-button-*` in
  value and not in name — this is the case **Sizing** anticipated. A token test
  asserts the two stay level, so either can be retuned without silently dragging
  the other along.

## Field

A form field's layout, and the one place its state is written down. Root plus
`Field.Set`, `Field.Legend`, `Field.Group`, `Field.Content`, `Field.Label`,
`Field.Description`, `Field.Error` and `Field.Separator`.

- **Orientations**: `vertical` (default), `horizontal`.
- **The cascade is a context, and it had to be.** `<Field isInvalid>` reddens the
  control inside it, not just its own label. On the web shadcn does that with
  `group-data-[invalid=true]/field:` — a parent-scoped selector. Uniwind has no
  equivalent: its compiler reads `data-*` off a **single flat selector**
  (`bundler/css-processor/processor.ts`) and its runtime matches them against
  `props[attribute]` on **the component carrying the class**
  (`core/native/store.ts`), so no class on a `Field` can reach the `Input`
  inside it. There is no `group-*`, no `peer-*`, no `:has()`. Do not go looking
  for one again.
- **The whole row drives the control, once one offers a press.** A control
  registers a callback through the same context the state cascades down, and the
  row becomes a `Pressable` with `feedback="none"` that calls it — so tapping
  "Accept the terms", or the description under it, ticks the `Checkbox` beside
  it. A checkbox in a form is a small square next to a sentence, and the sentence
  is what people aim at. This is `Input.Group`'s trick one level out: that group
  is a pressable whose press focuses the field through a ref on its context.
  `resolveFieldInteractive` is the decision and it is pure, so `bun test` reaches
  it. A field of static text registers nothing and stays a `View` — mounting a
  detector regardless would put one under every label and description in a form,
  the thing `Badge` refuses for a list of fifty tags. The row is
  `accessible={false}`, so the control stays the element a screen reader sees,
  and the inner detector claims a tap on the box itself rather than firing both.
  A field holds one control, so a second registration replaces the first.
- **A data-attribute class would also leave `bun test`.** Even for a part styling
  itself, `data-invalid:text-danger` moves the decision from `field.variants.ts`
  into uniwind's runtime matcher, where no unit test can see it. The parts style
  themselves from `tv()` booleans; the context is only for crossing a component
  boundary.
- **The text parts render the `Text` presets and pass a colour, never a scale.**
  `Field.Label` *is* `Text.Label`; `Field.Description` and `Field.Error` are
  `Text.Caption`. `resolveFieldTextColor` picks the colour and returns
  `undefined` to mean "leave the preset's own alone" — which is exactly what
  `Text`'s unnamed axes do. A `text-sm font-medium` in a slot here would be a
  second definition of `Text.Label`, the thing that kept `Input` from shipping a
  label part at all. A test asserts the text slots carry no size, weight or
  colour.
- **The gap ladder is the component.** `content` 0.5 → `root` 1.5 → `set` 4 →
  `group` 5. A label attaches to the control beneath it rather than the one above
  purely because the gap inside a field is tighter than the gap between two, and
  nothing else is doing that work. The test pins the **ordering**, not the
  numbers, so the spacing can be retuned without the test becoming a transcript
  of it.
- **Only the label fades when disabled.** The control dims itself, and a dimmed
  description stacked on a dimmed control reads as two problems rather than one
  state. The description stays muted when invalid too, so an appearing
  `Field.Error` is the one line that changed.
- **`Field.Error` renders nothing when it has no children**, so
  `<Field.Error>{error}</Field.Error>` removes itself once the value is fixed.
  It is deliberately **not** gated on `isInvalid`: a part that swallowed children
  a caller actually wrote, because of a prop on a sibling, would be a part whose
  absence is unexplainable from the call site. shadcn's `errors` array prop is
  not ported — it exists to accept react-hook-form and Standard Schema shapes,
  and this package takes no form dependency.
- **`Field.Separator` draws two rules, not one with a label on top.** The web
  version absolutely-positions a single rule and punches a hole in it with an
  opaque `bg-background` label, which is invisible only while the separator sits
  on exactly that colour — on a card or a sheet the hole shows as a block of the
  wrong shade. Two rules and a gap assume nothing about what is behind them. The
  playground's `/field/grouping` has the card case on screen.
- **`Field.Group` inserts no dividers**, unlike `ListGroup`. A list of rows
  without lines is a wall of text; fields are already held apart by whitespace,
  and a rule between every one is noise.
- **There is no `Field.Title`.** On the web it exists because a `<div>` is not a
  `<label>` — label-styled text with nothing to point `htmlFor` at. React Native
  has neither element nor association, so it and `Field.Label` would render the
  same `Text`.
- **A set holds no state.** `isInvalid` and `isDisabled` live on each `Field`,
  because a whole section turning danger says less than the one field that is
  actually wrong.

## Checkbox

A box that is ticked or not — alone, or as one of a group sharing a value list.
Root plus `Checkbox.Label` and `Checkbox.Group`.

- **Colours**: `default`, `primary`, `success`, `warning`, `danger`, `info` —
  Badge's set, reusing tokens the theme already has. **Sizes**: `sm`, `md`, `lg`.
  **Alignment**: `start`, `end`. There is no `variant` axis: a checkbox has one
  shape, and a second way to paint it would be a second thing to keep in step
  with the radio that will sit beside it.
- **The root draws the box itself**, which is what makes `<Checkbox />` a
  complete control with no children. Anything composed inside lands *beside* the
  box and shares its tap target — which is the entire reason `Checkbox.Label`
  exists next to `Field.Label`. `Field.Label` names a control from a row away;
  this one is inside the pressable, so tapping the words toggles the box. Use the
  field's in a horizontal `Field` and this one everywhere else.
- **`Checkbox.Label` *is* `Text.Label`.** It renders the preset and passes a
  step and a colour, never a class for either — `resolveCheckboxLabelSize` maps
  the checkbox's own step names onto `TEXT_SIZES`', and
  `resolveCheckboxLabelColor` returns `undefined` to mean "leave the preset's own
  alone". The `label` slot carries layout and nothing else, and a test asserts it
  holds no `text-*` or `font-*` at any size. Same rule as `Field`, same reason
  `Input` ships no label part at all.
- **`color` paints the indicator, not the box.** The indicator is an
  absolute-fill layer that is invisible until the box is ticked, so an unticked
  box is `border-input bg-card` at every colour — the same chrome a field wears,
  because it is the same kind of thing. Only the border has to know both states,
  which is why the six `color × isFilled` cells are the whole of
  `compoundVariants` instead of a thirty-six cell matrix. The border always
  matches its own fill, and a test pins the pair rather than trusting two maps.
- **`isFilled`, not `isChecked`, is the tv axis.** Checked and indeterminate both
  paint the surface and only the glyph tells them apart, so the axis is named for
  what it does and `resolveCheckboxFilled` is the translation. Indeterminate also
  reports `checked="mixed"`, so a "select all" row says what it means rather than
  claiming a half-truth.
- **Invalid outranks the colour**, on the border and the fill, ticked or not.
  A checkbox that stayed green while its value was rejected would drop the only
  signal it has, exactly while the value is being corrected — the precedence
  `Input` sets between invalid and focus.
- **The axis ladder is `own ?? group ?? field ?? default`, and it is deliberately
  not `Input`'s.** `Input.Group` puts itself *first* because it owns the one box
  a grouped field renders into: two answers to one question is not a state worth
  expressing. `Checkbox.Group` owns no box. It is a state controller that also
  carries shared defaults, which makes it the same kind of thing as `Field` — a
  wrapper a control overrides — so "make the group `lg`" and "make this one
  danger" are different questions and both get an answer. `??` throughout and
  never `||`, so `isDisabled={false}` opts a child out of a disabled group.
- **`Checkbox.Group`'s state is one array of the children's `value`s.**
  `toggleCheckedValue` is the whole transition and it is pure, so `bun test`
  reaches it — including that it always returns a *new* array, since React bails
  out of a re-render on an unchanged reference and a mutation would flip the
  state while leaving the screen alone. A grouped checkbox with no `value`
  throws by name: group membership is invisible in the child's props at compile
  time, so it cannot be a type error.
- **The group is a plain `View` with no role.** A group of checkboxes is a
  container, and announcing it as a control would put an actionless element in
  front of every child. Lay them out any other way with a `className` —
  `flex-row flex-wrap` for a row.
- **Inside a `Field` the box hands its toggle back up**, so the row is the
  target and a form checkbox can be a bare `<Checkbox />` with the field naming
  it, rather than a `Checkbox.Label` repeating the name. It registers a
  ref-backed trampoline rather than the toggle itself: the toggle is a new
  function whenever `checked` changes, and re-registering on every tick would
  re-render the field for nothing. See **Field**.
- **The whole `Pressable` surface passes through**, because the root *is* one.
  Two defaults differ from a bare `Pressable` and only two: `feedback="fade"`,
  since a spring on a 20pt square reads as a jitter rather than a press, and
  `haptic="selection"`, since a checkbox is a state toggle and the tick landing
  is the confirmation — `Button` and `Badge` leave it off because their press is
  an action, not a state change. Both are ordinary props, so `haptic={false}`
  silences it. `onPress` is the one prop `Omit`ed rather than forwarded: the
  press *is* the toggle, and `onCheckedChange` is where a side effect goes.
- **The fill, the tick and the border are three gestures off one shared value.**
  The fill fades and scales **from the centre**: a box is filled, not slid into,
  and there is no edge a checkbox is filled *from* — a `translateX` here reads as
  a panel arriving rather than a surface appearing, so there is none. The tick is
  not faded up with it; it sits behind a container whose width opens from the
  box's left edge, so the stroke is drawn on when ticking and taken back when
  unticking. `tickDelay` holds it until the surface it is drawn on is most of the
  way there — starting both at once reads as one blurred event. The border comes
  last, held by `borderDelay` until the surface is near the edge, so it reads as
  the fill *arriving* at the border rather than as an outline changing on its
  own. All three interpolate off a single `withTiming`, so they cannot drift, and
  the values live in `CHECKBOX_INDICATOR_ANIMATION` where a test pins that every
  track travels and that the filled end is a finished box rather than something
  stopped mid-way.
- **The fill's corner radius is the box's minus its border width, and it does
  not animate.** That subtraction is the rule for two rounded rectangles to sit
  concentric, and the fill sits inside the border, so it is the only value that
  looks right — in both directions. Rounder, and `overflow-hidden` cuts the
  fill's corners back past the border's, leaving a sliver of the box's own
  background at each one: that is what a `rounded-*` on the `indicator` slot
  does, since a class can only name the box's *outer* radius. Squarer, and the
  fill reads as a sharp square inside a rounded box for the whole of the
  animation. Animating it only makes it correct at one end. `scale` shrinks the
  rendered corner along with the square, which is what keeps a half-grown fill
  looking like a smaller version of the finished one.
- **It is a number, and there is no token for it.** 5pt and 7pt are not a scale;
  they are `--radius-xs` and `--radius-sm` with a border subtracted, so minting
  tokens would only give the pair a second place to disagree.
  `checkbox.variants.test.ts` reads `tokens.css` and asserts
  `CHECKBOX_FILL_RADIUS` *is* that subtraction, that `CHECKBOX_RADIUS_STEP`
  names the `rounded-*` the `box` slot actually wears, and that the box's border
  really is the bare 1pt `border` the arithmetic assumes. Retuning a radius, or
  reaching for `border-2`, fails the build rather than quietly reopening the
  gap.
- **The border is the one part of the box no `tv()` describes.** A colour that
  fades cannot be a class, so it interpolates between two token *values* —
  `resolveCheckboxBorderTokens` names them, and `CHECKBOX_SURFACE_TOKEN` is the
  same colour the `indicator` slot paints as a `bg-*`, pinned against it by a
  test. The base keeps `border-input` as the resting appearance the animated
  style starts from, and nothing else in the slot set mentions a border colour;
  two sources for one border is how a class and a style end up disagreeing for a
  frame on every toggle. An **invalid** box returns danger at *both* ends, so
  there is nothing to fade — the border is the signal the value is wrong, and it
  has to be there before the box is ticked as much as after.
- **The clip is measured, not tabulated.** It needs the box's width in points and
  `size-checkbox-md` cannot be read from JavaScript, so it comes from the fill
  layer's own `onLayout` — that layer is already exactly the width the clip has
  to span. A table of numbers here would be `tokens.css` restated in TypeScript,
  which is the drift `tokens.test.ts` exists to catch everywhere else.
- **Reduce-motion takes Reanimated's default `System` policy here**, unlike
  `Spinner`. Under it `withTiming` completes instantly, which for a checkbox is
  right: the state change is the point and the travel is decoration. A spinner
  had to opt out because its animation *is* the status signal.
- **`hitSlop` is new to this package, and only a bare box gets any.** A bare `md`
  checkbox is a 20pt square against a 44pt minimum, with no padded capsule to
  absorb the difference the way `Badge.CloseButton` has. Once there is a label
  the row is the target and is already wide, so `resolveCheckboxHitSlop` returns
  nothing — slop on top of that would overlap the row below and make a tap
  between two checkboxes ambiguous, which is worse than a merely adequate target.
- **There is no `Checkbox.Description` and no `Checkbox.Indicator`.**
  `Field.Description` already is the first, and a label defined twice is a type
  scale that can drift. The second has nothing to configure that
  `isIndeterminate` does not already decide — the glyph swap is the only choice
  it would offer.
- **The box mints no scale of its own — it reads `--spacing-icon-*`, two steps
  above its own glyph.** A checkbox *is* a glyph in a box, and both measurements
  already sit on that scale: 18/14, 20/16, 24/18. A private
  `--spacing-checkbox-*` would be three numbers that have to be retuned in step
  with three others forever, and nothing would notice when they stopped
  agreeing. The two-step offset is what leaves the tick breathing room, and a
  test pins the *offset* rather than the points, so the icon scale can be
  retuned without the test becoming a transcript of it.

## Slider

A value picked by dragging along a track — one value, or a range. Compound root
plus `Slider.Output`, `Slider.Track`, `Slider.Fill` and `Slider.Thumb`. The
package's first drag-driven control, and its first `Gesture.Pan()`.

- **Colours**: `default`, `primary`, `success`, `warning`, `danger`, `info` —
  Badge's and Checkbox's set. **Sizes**: `sm`, `md`, `lg`, driving the groove's
  thickness, the thumb's diameter and the readout's type step.
  **Orientations**: `horizontal`, `vertical`.
- **The anatomy is written out, never assembled from props.** A range's thumb
  count is *data*, so `Slider.Track` takes a function and is handed the settled
  state to map over. `Radio` composes its own indicator in because a radio has
  exactly one; a slider does not know how many it has until it is told.
- **The root is not a `Pressable`, and neither is the thumb.** Three reasons and
  all of them structural. `Pressable` mounts a `Gesture.Tap()` whose `onEnd`
  fires `onPress`, so every tap-to-position would also fire a press. Its root
  `Animated.View` already owns `opacity` and `transform` through a
  `useAnimatedStyle` of its own, and the thumb's position *is* a `transform` —
  two animated styles on one node fight for the same prop, the rule
  `Radio.Indicator` states and the reason `Radio` takes no `asChild`. And a thumb
  wrapped in its own `Pressable` would nest a descendant `Tap` inside the track's
  ancestor `Pan`, leaving two recognisers to negotiate for one drag. What is
  inherited is the *vocabulary*: `HapticFeedback` and `playHaptic` come from
  `pressable.tsx`, which is exported for exactly this — one haptic switch in the
  library, never a second.
- **`Slider.Thumb` holds no gesture at all.** One pan on the track drives every
  thumb, because a press 40pt along an empty groove should still lift the thumb it
  is about to move, and a per-thumb gesture cannot know that. The grabbed scale is
  therefore driven by an `activeIndex` shared value the track writes, not by a
  press state the thumb owns.
- **The value is written in `onBegin`, not only in `onUpdate`.** This is the one
  that will bite a rewrite. A pan activates on the first *movement*, so a
  stationary tap never reaches `onStart` or `onUpdate`: a slider that computed
  only there would tick, lift its thumb, and then not move it. `onFinalize` is
  likewise where the drag is reported finished, because it is the only callback
  that fires on every path, the never-activated one included.
- **`minDistance(0)` is what wins the touch from a scroll view**, and it is not
  tuning. `Screen.ScrollArea` renders React Native's own `ScrollView`
  (`Animated.ScrollView`), not Gesture Handler's, so there is no sibling handler
  to negotiate with — the two race, and a pan that activates on the first move
  beats a scroll view's ten-point slop on both platforms. Which is also why there
  is **no `activeOffsetX`**: waiting for the axis to declare itself hands the
  scroll the first move and puts a dead zone at the start of every drag.
  **`blocksExternalGesture` is not the escape hatch it looks like** — it resolves
  a ref to a handler tag, a plain `ScrollView` has none, and Gesture Handler drops
  the call without an error. If Android ever hands a drag to the scroll anyway,
  the documented fix is a nested `GestureHandlerRootView` around the slider, not
  an offset filter.
- **`shouldCancelWhenOutside(false)`**, where `Pressable`'s tap sets it `true`.
  Dragging a thumb to the far end routinely leaves the track's bounds, and the
  value has to keep tracking rather than the gesture giving up half way.
- **On iOS, a slider inside a scroll view feels late until
  `delaysContentTouches={false}`.** UIScrollView's default holds touch delivery to
  its descendants for about 150ms while it decides whether the touch is a scroll.
  Nothing inside this component can reach that — it is a prop on the scrollable,
  so it belongs at the call site.
- **The groove is not the touch target on its own.** A `sm` track is sixteen
  points, so the drag is claimed on a transparent `touchArea` whose padding brings
  it up to 44. The thickness and that padding live in the **same compound cell**,
  because they are one number: they sum to 44 at every size, and a test asserts
  the sum rather than the parts so the ladder can be retuned without the test
  becoming a transcript of it. Split them across two variants and a retune of the
  thickness silently shrinks the target.
- **That padding is on the cross axis only**, and this is the load-bearing half.
  The two boxes share an origin along the axis the value is measured on, so the
  pan reads its offset straight off the touch with no gutter to correct for. Pad
  the main axis and every value is wrong by the padding, silently, and visibly
  only at the ends.
- **The colour paints the fill, the capsule and the knob — never the groove.** An
  empty groove is the same chrome at every colour, the way an unticked checkbox is
  `border-input bg-card` however it is coloured, and a test asserts that. Invalid
  outranks the colour on all three, the precedence `Checkbox` sets on its border.
- **The capsule takes the fill's own colour, and the knob takes that colour's
  `-foreground`.** The first is what makes the handle read as the leading end of
  the fill rather than as something sitting on top of it — same colour, no seam.
  The second is rule 11 doing its job: a single pale knob would be unreadable on
  `warning`, whose foreground is near-black, so the knob follows the surface it
  sits on. A test pins the pair rather than trusting two maps to stay in step, and
  checks every token it names exists in both variants of `theme.css`.
- **`default` and `primary` name different tokens this theme tunes to the same
  value.** `foreground` is the page's ink and `primary` is the brand's action
  colour; both are `#262626` today, which is the situation `Badge` already
  documents for its neutral end. Collapsing them into one token would be the
  drift, not the duplication — an app that re-themes `primary` to blue wants
  `color="primary"` blue and `color="default"` still ink. A test pins that the
  four *semantic* colours stay distinct from each other and from both neutrals,
  and that every token named is declared in **both** variants of `theme.css`.
- **The handle is two nodes: a capsule and a knob.** The capsule carries the
  colour, the size and the position; the knob is the pale bar inside it, held off
  the capsule's edge by its padding, and the only thing that moves when a finger
  lands. One node could not be both the surface and the thing inset within it.
- **Neither takes a shadow**, and the capsule takes no border either. Nothing else
  in this package draws a shadow, and React Native's shadow props diverge between
  platforms in a way a flat fill does not; a test sweeps the whole matrix for the
  absence. The capsule is a solid block of the fill's colour, so its edge is
  already the boundary between the fill and the groove — a border would be a
  second line drawn over one that is already there.
- **The capsule is flush across the track and longer along it.** The flush half is
  geometry rather than decoration: it is what lets `fillExtent` land exactly on
  both extremes — one capsule's length of fill at the minimum, so the handle covers
  it completely and a slider at rest shows a plain groove; the track's full length
  at the maximum, with no sliver past the handle; and one capsule's length again
  for a collapsed range, so the fill does not blink out from under two handles
  dragged together. Inset the capsule inside the track by any padding and every one
  of those is off by the inset, at every size. The long axis is two steps up from
  the short one, which is what makes a handle you can tell apart from the groove.
- **Both are plain spacing steps, not tokens.** They are numbers read in one
  component, which is the trade `Radio` already makes for the dot inside its ring.
  `Checkbox` reads `--spacing-icon-*` for its square and should keep doing so: a
  glyph in a box is a mark on the icon scale, where a slider's handle is the body
  of the control itself. This is why the handle stopped reading that scale.
- **The capsule's size lives in the same six compound cells as the track's
  thickness**, not in a `size`-only variant, because its two axes differ and only
  the orientation knows which is which.
- **The track still centres the thumb, and now has nothing to centre.** An
  absolutely-positioned child with no cross-axis inset is placed at the static
  position the parent's `items-center` decides. That did the work while the thumb
  overhung a hairline groove; it is a no-op now the two are the same size. It
  stays because it is load-bearing again the moment those sizes are allowed to
  differ, and because it is why the track is `flex-row` when horizontal:
  `items-center` centres on the *cross* axis, and a column track would centre the
  wrong one.
- **Every length is measured, never tabulated.** `trackSize` and `thumbSize` come
  from their own `onLayout` — `size-5` cannot be read from JavaScript, and a
  table of numbers here would be `tokens.css` restated in TypeScript, the drift
  `tokens.test.ts` exists to catch everywhere else. A measured `0` therefore means
  **not measured yet**, never "a track with no length": every geometry helper
  guards `travel <= 0` and the thumb renders at `opacity: 0` until the track has
  reported, because a thumb drawn before then sits at a garbage offset for a frame
  and reads as a flicker on every mount.
- **The fill runs to the thumb's far edge**, which is the `+ thumbSize` in
  `fillExtent` and the reason both extremes come out exact. It used to stop at the
  thumb's *centre*, which was correct but invisible while a large disc overhung a
  hairline groove; with the thumb now the same size as the track, a half-thumb of
  bar would sit unfilled at the maximum in plain view. A lone thumb fills from the
  start of the track, because that is what a single value means; a range fills
  *between* its thumbs, because the ends are what the caller excluded. The extent
  is floored at one thumb so a collapsed range never disappears.
- **The pixel arithmetic is a function, not four lines in `slider-fill.tsx`.**
  `fillExtent` earns its place because what it encodes is not self-evident — it is
  the whole justification for the thumb's size — and inline in a `.tsx` no test
  could reach it. `travel` and the touch's `position` are the opposite case and
  stay written out: `trackSize - thumbSize` and `along - thumbSize / 2` appear in
  three files and are self-evident, and routing them through a cross-module
  worklet would add a call in three per-frame paths to hide arithmetic nobody
  would get wrong.
- **The vertical axis turns around in exactly two places**: `valueFromOffset`'s
  inversion and the sign of the thumb's translate. Not in a `flex-col-reverse` —
  the fill and the thumb are absolutely positioned, so a `flexDirection` never
  reaches them, and a reversed column flips every `justify-*` inside the track as
  well. A test asserts the two orientations are mirror images, reading a vertical
  track from the far end and a horizontal one from the near end and demanding the
  same value. A vertical slider needs a **definite height** from its parent.
- **Both ends of the range are always stops**, even when the step does not divide
  it. 0–100 by 7 reaches 0, 7, 14 … 98 and then 100, because a slider whose
  maximum cannot be reached by dragging all the way to the end is a slider that
  lies about its own range. A tie goes to the regular stop, so the extra one only
  ever appears at the very end of the drag.
- **Snapping happens on the UI thread, and that is what bounds the re-renders.**
  `positions` holds *snapped* values, so the mirror back to React fires on a step
  crossing rather than on a frame — a full-width drag at the default step is a few
  dozen commits, not a hundred and twenty a second. `step={0}` is continuous and
  does re-render per frame; that is the trade for `formatOptions`, since `Intl` is
  not available to a worklet and a readout derived on the UI thread could not
  format a currency. If it ever profiles badly the escape hatch is an
  `Animated.Text` fed by a `useDerivedValue`, which `Text` already renders.
- **`positions` is one `SharedValue<number[]>`, reassigned and never mutated.**
  One shared value per thumb is not available — a thumb count is data and hooks
  cannot be called in a loop — so the array is the shape. `positions.value[0] = x`
  updates nothing and fails **silently**: an array element has no setter behind
  it. Always build a new array and assign it.
- **A drag stops the root syncing the shared value from React state.** The mirror
  hop back would otherwise round-trip through a render and land on the thumb a
  frame late, dragging it backwards on every commit — a jitter only a fast drag
  reveals. The guard is a ref, because nothing renders differently for it. Its
  counterpart is `settledDrags`, a counter bumped on release whose only job is to
  give the sync effect something to re-run on: a **controlled parent that rejects
  a dragged value** leaves `current` unchanged, and without the token the thumb
  would stay where the finger let go instead of snapping back.
- **The shape is the caller's, and it is locked on first render.** A slider given
  a number reports a number; one given an array reports an array. Switching warns
  in development and follows the caller, the lock-and-warn `useControllableState`
  already runs for controlled versus uncontrolled — a slider that silently started
  reporting an array to a caller holding a number is a bug with no error attached.
- **The haptic is rate-limited by distance, not by a clock.** "Tick when the
  snapped value changed" is not a limit on its own: 0–100 in whole steps across a
  300pt track is a step every three points, and a flick crosses a hundred of them
  in a fifth of a second — a buzz, and a hundred synchronous calls into the haptic
  engine to produce it. `shouldTickHaptic` gates on `SLIDER_HAPTIC_MIN_TRAVEL`,
  which keeps the rule pure so `bun test` reaches it and makes it degrade the right
  way: a coarse scale ticks on every stop, a fine one thins to a cadence a hand can
  feel. Either **end** of the range always ticks — it is the one moment a slider
  has something to say the screen does not already show. The grab itself always
  confirms, the way a press does. A continuous slider never ticks, because there
  is no stop to land on.
- **`accessibilityRole="adjustable"` on the thumb, and this is the package's first
  `accessibilityValue`.** It is not polish: the thumb holds no gesture, so without
  `accessibilityActions` and `onAccessibilityAction` there is no assistive path to
  the value **at all** — a VoiceOver or TalkBack swipe would have nothing to call.
  The increment steps by `step`, or by a tenth of the range when the slider is
  continuous. `updateValue` is the one way into the value that has no gesture
  behind it, and it runs the same snap and the same clamp the pan does.
- **A worklet crosses back to JS with `scheduleOnRN`**, never `runOnJS` — see
  **Pressable**. `onFinalize` queues `setDragging(false)` *before* `commitEnd`, and
  the order is load-bearing: the root has to have stopped treating this as a live
  drag before it is asked to re-sync.
- **Every exported worklet in `slider.variants.ts` is flat.** None of them calls
  another. A module-scope worklet is rewritten into a factory call that runs at
  import time in source order, so a worklet calling a sibling works only while the
  sibling happens to be declared first — and a tidy-up that reorders the file
  crashes the UI thread with `undefined is not a function`. That is the real shape
  of the `clampUnit` incident the **Screen** section records: not "cross-module is
  unsafe" — `screen.variants.ts`'s own resolvers are imported into
  `useAnimatedStyle` and work — but "a module-scope worklet must not depend on one
  declared below it". The pan's own shared helper lives *inside* the `useMemo`
  beside its callers, where ordinary closure capture applies.
- **There is no `Slider.Group`**, so the axis ladder is two rungs rather than
  three: the slider's own props, then an enclosing `Field`. A `Field` reaches the
  two *state* axes only, and a test pins that it cannot acquire a paint axis by
  accident. The slider does **not** register `field.registerPress` the way a
  `Checkbox` does — a row-wide press has no meaning for a control whose value is a
  position.

## Switch

A binary preference, flipped by a tap or by dragging its thumb. Compound root
plus `Switch.Thumb`, `Switch.StartContent` and `Switch.EndContent`. It inherits
almost every structural decision from **Slider**, which is the section to read
first — what follows is only where a switch differs.

- **Colours**: `default`, `primary`, `success`, `warning`, `danger`, `info` —
  Badge's, Checkbox's and Slider's set. **Sizes**: `sm`, `md`, `lg`. There is no
  `variant` axis: a switch has one shape, and a second way to paint it would be
  a second thing to keep in step with the checkbox beside it.
- **The root is not a `Pressable`**, for `Slider`'s three reasons: its
  `Gesture.Tap()` would fire `onPress` on every toggle, its root `Animated.View`
  already owns `transform` — which is exactly what a thumb's position is — and a
  thumb inside its own pressable would nest a descendant recogniser in the
  root's. `HapticFeedback` and `playHaptic` are imported from `pressable.tsx`,
  which is what that export is for.
- **One `Gesture.Pan()` serves the tap and the drag, and there is no `Tap` to
  race it.** A release whose finger barely moved *is* the tap, which
  `resolveSwitchRelease` decides along with everything else: tap slop first, then
  a flick's velocity, then the position. Two recognisers would have to negotiate
  which one owned a press that turned into a drag, and the negotiation is the
  bug — this way there is nothing to arbitrate.
- **`distance` is the larger of the two axes, not the along-track
  translation.** A vertical swipe that began on the switch moves nothing
  horizontally, so reading only that axis would call every attempt to scroll past
  the control a tap and toggle it. Reading both means such a swipe is movement
  with no travel, which settles back to the state it started in — the switch is
  left alone.
- **The value is settled in `onFinalize`, and only there.** Unlike a slider there
  is nothing to write on `onBegin`: a switch has no position to move a handle to,
  only a state to end up in. `onFinalize` is still the callback because it is the
  one that fires on every path, the never-activated one included — which is
  exactly the path a stationary tap takes.
- **`minDistance(0)` and `shouldCancelWhenOutside(false)`**, for the reasons
  **Slider** sets out. The cost is the same one: a drag that starts on the switch
  is the switch's, so you cannot scroll a list by putting your finger on one.
- **The knob is a rounded rectangle lying on its side, not a disc**, and it is
  the reason the thumb stopped reading `--spacing-icon-*`. That scale is where a
  *glyph* belongs; a knob is the body of the control rather than a mark drawn on
  it — the move `Slider`'s handle already made, and why `Checkbox` still reads
  that scale for a square that really is a glyph in a box. No
  `--spacing-switch-*` was minted either way; the thumb is plain spacing steps.
- **Three relationships hold at every size, and the tests pin each rather than
  the points.** The knob's width is the track's height; its height is that less
  twice `SWITCH_THUMB_INSET`; and because both are `rounded-full`, the two
  capsules come out **concentric** — each radius is half its own height, so the
  difference is exactly that inset. It is the subtraction `Checkbox`'s fill makes
  against its border, arrived at by construction rather than by a number.
- **One inset, all four sides, and only two of them are written down.**
  Horizontally it is a class the travel maths subtracts twice; vertically it is
  never written at all, because the track is `justify-center` and an absolutely
  positioned child with no vertical inset is centred by its parent — `Slider`'s
  rule, where the track centres the thumb and the thumb carries no offset of its
  own. On that axis the constant is a relationship a test pins, not a value
  anything reads.
- **A content layer is as wide as the travel, not as wide as the knob.** It
  occupies exactly the space the knob vacates at its own end, which is what the
  travel *is*. Size it like the knob and the far layer reaches under a knob drawn
  on top of it, and its text is clipped — visible only at the size where the text
  is longest, which is the last place anyone looks.
- **The knob draws no border and no shadow.** A border is a second line where
  there is already a boundary, and against a saturated track it reads as a dark
  ring rather than as definition; `Slider`'s handle dropped its own for the same
  reason. Contrast at rest comes from the track instead, which is why
  `SWITCH_TRACK_REST_TOKEN` is `input` — the chrome a field's own box wears, a
  step darker than the page in light and a step lighter in dark, so a knob
  painted the page's own colour reads against it at either end of the theme.
- **The track and its touch padding ride in the same size cell**, summing to 44pt
  at every size, and the test asserts the sum rather than the parts — `Slider`'s
  rule, and the trap it names: split them across two variants and a shorter track
  silently shrinks the target.
- **Every colour on the control is interpolated, so the `tv()` describes almost
  none of it.** The track, the thumb and both content layers fade between two
  token *values* off the one `progress`, and a colour being interpolated cannot
  be a class — `Checkbox`'s border, four times over. The slot set keeps
  `bg-secondary` and `bg-background` as the resting appearance those styles start
  from and names no colour anywhere else; the maps are the single source. There
  is deliberately **no `color` axis in the `tv()`** — a `bg-*` per colour there
  would be a second source for one surface, which is how a class and a style end
  up disagreeing for a frame on every toggle.
- **The thumb takes the `-foreground` of the track it is travelling on**, so a
  pale knob is never left unreadable on `warning`. `default` is the exception the
  theme forces: there is no `--color-foreground-foreground`, and `background` is
  what content drawn on the page's ink actually is. A test pins the whole map
  against the track's.
- **`Switch.StartContent` and `.EndContent` crossfade themselves.** Start sits at
  the leading edge, which the knob vacates as the switch turns **on**, so it fades
  in with `progress`; end is the mirror. That is the whole reason both can be
  written once with no `isSelected &&` at the call site — the knob reads as
  uncovering the other end rather than sliding over content that was always
  there. Each layer is exactly the thumb's footprint at its own end, so a glyph is
  centred on the space the knob will vacate rather than beside it, and each
  publishes an `IconDefaultsProvider` and a `TextClassProvider` for the surface it
  sits on: the coloured track for start, the resting one for end.
- **A glyph's colour is a token and a `Text`'s is a class**, so
  `SWITCH_CONTENT_TEXT_CLASS` exists beside `SWITCH_THUMB_TOKEN` rather than being
  derived from it — Tailwind's scanner is static, so a runtime `text-${token}` is
  never compiled and would silently draw nothing. A test pins every entry against
  the token it must agree with.
- **The thumb is drawn last however the children were written.** Every part is
  absolutely positioned and React Native paints later siblings on top, so a
  `Switch.Thumb` written first — which is the order the anatomy reads best in —
  would slide *under* the content layers. The root reorders rather than leaving a
  gotcha in the API, and composes one in when the children hold none, so
  `<Switch />` is already a complete control.
- **The track scales on press, and the thumb does not** — the reverse of
  `Slider`, which grows its handle. The track clips, so a scaled knob would be
  cut off by its own capsule: a bite taken out of the knob rather than an
  acknowledgement of the press. The outermost node is the one thing nothing can
  crop, so that is where the feedback lives, on `Pressable`'s own `PRESS_SPRING`
  so a switch and a button answer a touch identically.
- **The thumb's own spring is critically damped**, where every other spring in
  this package overshoots a little. A wider knob travels a shorter distance
  inside a track that clips it, so an overshoot has nowhere to go — it would
  visibly squash against the end of its own capsule on every toggle. A test pins
  the damping ratio at or above one, and below the point where it crawls.
- **The colours interpolate off `progress`, not off a timing of their own.** The
  track therefore colours *with the finger* through a drag rather than snapping
  when it is let go, and there is no second clock for the position to drift
  from — the reason all four animated properties read one shared value.
- **The haptic fires at the commit, never at the grab.** A slider ticks on grab
  because the grab already moves the value; a switch dragged half way and released
  back has changed nothing, and one that buzzed for it would be reporting a state
  change that did not happen. Default `haptic="selection"`, matching `Checkbox`.
- **`settledDrags` and the `isDragging` ref are `Slider`'s, verbatim in shape.**
  A controlled parent that rejects a dragged value leaves the state unchanged, so
  without a token that moves on every release the sync effect has nothing to
  re-run on and the thumb stays where the finger let go. The playground's
  `/switch` has a switch that rejects every change, so the spring-back is on
  screen rather than merely asserted.
- **Reduce motion is left at Reanimated's default `System`**, with `Radio` and
  `Checkbox` and against `Spinner`. The state is carried by the thumb's
  *position*, so snapping straight to it is the right degradation.
- **The accessibility surface is written out, because there is no `Pressable` to
  inherit it from.** `accessibilityRole="switch"` and a checked state announce it;
  `onAccessibilityTap` and an `activate` entry in `accessibilityActions` are what
  actually flip it, on iOS and Android respectively. Without them the switch would
  announce its state and offer no way to change it — the same gap
  `Slider.Thumb`'s `adjustable` actions close.
- **There is no `Switch.Label` and no `Switch.Group`.** The track is a fixed pill
  and a label cannot sit inside it, so the name is a `Field.Label` or a
  `ListGroup.ItemTitle` a row away — and unlike `Slider`, the switch **does**
  register `field.registerPress`, because a row-wide press means exactly what a
  tap on the pill means. A switch is a binary preference, not one of a set, so
  there is nothing for a group to own; the axis ladder is two rungs, the switch's
  own props then an enclosing `Field`.
- **A part is recognised by its `displayName`, never by reference alone.** The
  root composes a `Switch.Thumb` in when the children hold none, which means it
  has to *ask* whether a child is one — and `child.type === SwitchThumb` is not a
  safe way to ask. This package ships raw `.tsx` for the consuming app to
  compile, so React Compiler rewrites the binding on the way through, and Metro
  can serve two instances of one module through a workspace symlink; either
  leaves an element whose `type` is a different object standing for the same
  component. The failure is silent and nearly invisible: detection returns false,
  a second knob is composed on top of the caller's, and because the two are the
  same size and colour the only symptom is that **anything inside the caller's
  knob disappears**. `displayName` survives all of it — rule 12 requires one and
  `display-name.test.ts` enforces that they are present and unique — so that is
  what `isSwitchThumbElement` asks for, with reference equality kept only as the
  fast path.

  **`Radio` and `ListGroup` still ask the unsafe question** (`radio.tsx`'s
  indicator detection, and the divider and icon-swap walks elsewhere). Nobody has
  reported it because their duplicates overlap invisibly rather than hiding
  content — a second ring exactly behind the first. Worth fixing the next time
  one of them is touched.
- **RTL is not handled.** The thumb travels on `translateX`, which does not flip,
  and nothing else in this package handles it yet. Stated here rather than
  half-solved.

## Badge

A compact label for status, category or count. Compound root plus `Badge.Label`,
`Badge.StartContent`, `Badge.EndContent` and `Badge.CloseButton`.

- **Two axes, not one.** `variant` says how the surface is painted — `solid`,
  `soft`, `outline`, `ghost` — and `color` says what it means — `default`,
  `primary`, `success`, `warning`, `danger`, `info`. **Sizes**: `sm`, `md`, `lg`.
  `Button` collapses the two into a single enum, and a badge deliberately does
  not: six semantic colours are the point of this component rather than an
  afterthought, and one axis would need thirteen names to say what two say with
  ten. Neither axis paints a surface alone, so all twenty-four pairings live in
  `compoundVariants`; a test asserts every cell is distinct, because two cells
  collapsing means a caller can set an axis and see nothing change.
- **A badge is content until it is given something to do.** With no `onPress`
  and no `onLongPress` the root is a plain `View`. Mounting a `GestureDetector`
  regardless would put one under every tag in a list of fifty and announce each
  of them to assistive technology as a button with no action. `resolveBadgeInteractive`
  is that decision, and it is pure so `bun test` reaches it. Supply either
  handler and the root becomes a `Pressable`, inheriting `feedback`, `haptic`
  and the rest; only the default differs, `scale`.
- **`onClose` is its own pressable, never a mode of the root.** The dismiss
  control is a `Badge.CloseButton` composed in at the end, so its tap is claimed
  by the inner detector and never also fires the badge's `onPress`. It presses
  with `fade` rather than the root's `scale` — a spring on a glyph that small
  reads as a jitter. Reach for the part by hand only to place it somewhere other
  than last.
- **A size is padding, never a height.** `Text` respects OS font scaling, so a
  fixed height clips the label at a large accessibility step instead of growing
  with it — and unlike `h-button-*` or `h-navbar-row`, a badge lines up against
  no chrome that would force the number. A test asserts the root carries no
  `h-*` at any size. The icon step indexes the shared `--spacing-icon-*` scale,
  so a glyph in a badge matches every other glyph in the library.
- **`self-start` is load-bearing.** A badge is sized by its content, and inside a
  gap column every child is stretch-aligned by default — without it a one-word
  badge spans the whole screen.
- **The border is reserved on every variant, transparent until `outline`
  colours it.** Declaring it only where it shows would make the badge two points
  wider the moment a caller switched variant. `overflow-hidden` is likewise not
  tidiness: a pressed badge fades to the edge of its own capsule.
- **The neutral end of the matrix reuses tokens the theme already has.** This
  theme's `primary` is a near-black whose tint *is* the neutral fill, so a
  `--color-primary-soft` would duplicate `secondary` exactly. `soft` takes
  `tertiary` for `primary` and `muted` for `default` instead — two fills the
  theme already tunes per mode. The four semantic colours did get real tokens:
  `success-soft`, `warning-soft` and `info-soft` joined the existing
  `danger-soft` in `theme.css`, foregrounds included.
- **`BADGE_FOREGROUND_TOKEN` is nested, `Record<variant, Record<color, string>>`,**
  so adding a colour is a compile error in four places rather than a silent gap
  in one. A test pins each entry to the token its own `label` slot resolves to —
  two maps that can drift is how a badge ends up with a grey glyph beside white
  text — and asserts every token it names is declared in **both** variants of
  `theme.css`.
- **Icons are composed, never passed as props**, the way `Button` does it. The
  root wraps its subtree in an `IconDefaultsProvider` and a `TextClassProvider`,
  so a bare `<Icon>` or `<Text>` inside a badge comes out at the right size and
  colour with nothing said at the call site. One text treatment covers the whole
  subtree, which is the condition **Text** sets for publishing into the cascade.
- **String children** are wrapped in a `Badge.Label` automatically, consecutive
  strings collapsing into one — the same rule, and the same reason, as `Button`.

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
- **The arc's caps are `butt`, and its round head is a separate `Circle`.** The
  two half-rings share the endpoint at the bottom of the ring, where both sit at
  `SPINNER_ARC_JOINT_OPACITY`. Round caps there stack, and two semi-transparent
  discs composite to roughly 0.8 alpha — a bright dot straddling the joint,
  opposite the head, at every size. Butt caps abut instead, and the one end that
  wants rounding gets a disc of its own, drawn last so it sits on top; the tail
  terminates fully transparent at that same point, so its flat end is invisible.
  Do not put `strokeLinecap="round"` back.
- **The gradient stops are angle-compensated, and run in user space.** A linear
  gradient fades along its axis and that axis is `y`, but a point at angle θ
  clockwise from the top sits at `y = 12 - 10·cos θ` — so two stops alone make
  the fade stall near 3 and 9 o'clock and race through 12 and 6, and the ring
  reads as a bright chunk beside a flat grey quadrant rather than as an even
  comet. `spinnerArcStops` places each stop at the offset the arc actually
  occupies at that angle while stepping the opacity evenly, which inverts the
  skew; it is pure, so `bun test` pins the whole ladder.
  `gradientUnits="userSpaceOnUse"` then keeps the endpoints exact, where an
  object bounding box would leave open whether a given renderer includes the
  stroke — which shifts both ends off 0 and 1 and clips the head and the tail.
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
- **One optional peer.** `@legendapp/list` is `peerDependenciesMeta.optional`,
  so an app that never imports `Screen` never resolves it.
  `react-native-keyboard-controller` used to be the second — see
  **DelacourProvider** for why it stopped.
- **The app must mount `DelacourProvider` at its root.** It supplies the gesture
  root, `SafeAreaProvider`, `KeyboardProvider` and — the one that is not optional
  polish — `<KeyboardStateSync />` inside the keyboard provider.
  `KeyboardProvider` owns exactly one pair of shared animation values for the
  whole app, and on iOS they are written only from the `will` events. Any
  teardown that skips one — an interactive dismiss interrupted by navigation, a
  stack pop, an app suspend — pins them open app-wide, and every screen then
  renders "keyboard open" over a keyboard that is not there. `Screen.Footer` runs
  the same repair on mount as a backstop.

## DelacourProvider

Every provider an app needs at its root, in one component. Mount it once, around
everything — a root layout, an `App.tsx`.

- **Four layers, outermost first**: `GestureHandlerRootView` →
  `SafeAreaProvider` → `KeyboardProvider` → `<KeyboardStateSync />` beside the
  children. The order is not stylistic. The gesture root has to be an ancestor
  native view of every handler a `Pressable` creates, and its absence is
  *silent* — no error, no warning, presses simply stop landing.
  `KeyboardStateSync` has to be a CHILD of `KeyboardProvider`, because it calls
  `useKeyboardContext()`.
- **`initialMetrics` defaults to `initialWindowMetrics`, and that is
  load-bearing.** `SafeAreaProvider` renders `null` — not unstyled children,
  *nothing* — until its native view reports the first `onInsetsChange`, so
  without the seed every cold start shows a blank frame. The seed is a snapshot
  taken at native module init, so it is stale when the app launches into a
  rotated or split-screen window — stale for exactly one commit, because the
  native measurement overwrites it. A blank frame on every launch is the worse
  trade. `initialMetrics={null}` opts out: a default parameter only fires on
  `undefined`, so `null` is a value rather than an absence, the same rule
  `pressedScale` follows.
- **`style` reaches the gesture root and carries no default.**
  `GestureHandlerRootView` applies its own `{ flex: 1 }` whenever `style` is
  undefined, so merging one in here would both duplicate it and make the prop
  behave differently than it does upstream. Pass a style and that `flex: 1` is
  gone — include it yourself.
- **No per-layer escape hatches, and no layer-named props.** No
  `gestureHandler={false}`, no `safeAreaProps`, no `keyboardProps`. A boolean
  that turns off the gesture root has "nothing responds to a press" as its
  failure mode, which is the least debuggable outcome in the package. And a prop
  surface that names the layers changes shape every time a layer is added:
  `children`, `style` and `initialMetrics` say nothing about what is inside, so a
  future `BottomSheetModalProvider` or portal host is an edit to one file rather
  than a breaking change. An app that genuinely needs a different stack composes
  the providers by hand — they are all public from their own packages, and this
  is a convenience, not a gate.
- **A new layer goes innermost.** Anything that draws above the app — a
  bottom-sheet modal provider, a portal host, a toast host — has to sit inside
  every provider it reads, so it wraps `{children}` and nothing else moves. A
  layer that brings a new native peer is a peer-dependency decision first.
- **Deliberately not idempotent.** It does not detect an enclosing copy of
  itself. Nesting `GestureHandlerRootView` costs a `View`; nesting
  `SafeAreaProvider` seeds from the parent's insets and costs a native view;
  nesting `KeyboardProvider` is the one that actually breaks — two pairs of
  shared values, two sets of native observers, and the outer `KeyboardStateSync`
  repairing values nobody reads. That is also the only layer that cannot be
  detected: `useKeyboardContext()` returns a module-private default object
  outside a provider, that object is not exported, and the hook `console.warn`s
  whenever it hands one back, so a detection read would print a warning in every
  correctly-mounted app. A guard covering the two harmless layers and missing the
  harmful one is worse than none — it teaches callers that nesting is fine.
- **`react-native-keyboard-controller` is a required peer because of this
  component.** It was optional while `Screen` was the only importer: an app that
  never imported `Screen` never resolved it. The recommended root now imports it,
  so every app resolves it, and the flag had stopped describing reality — all it
  still did was suppress the install warning that would have explained the Metro
  resolution error coming out of the app's root layout. Rule 3's promise is
  per-subpath and survives intact: `/button` still pulls nothing
  keyboard-related.
- **Nothing here for `bun test`, and no `provider.variants.ts` to give it
  some.** The component is four nested elements and one default parameter;
  extracting a `resolveInitialMetrics()` would be a unit test of `??`. The rule
  that pure decisions live in a `*.variants.ts` has no decision here to
  relocate.
- **No gallery route.** See **Adding a component**.

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
| `--spacing-input-*` | `h-input-md`, `min-h-input-md` | a field's height — fixed on one line, a floor when multiline |
| `--text-input-*` | `text-input-md` | a field's value, paired with its height |
| `--spacing-navbar-row` | `h-navbar-row` | the navbar's control row, without its safe-area band |
| `--spacing-screen-gutter` | `px-screen-gutter` | the gutter `Screen.Header`, `Screen.Navbar` and content share |

**`Icon` and `Spinner` share one scale.** `SPINNER_SIZES` *is* `ICON_SIZES`, so
`size="md"` is the same edge length in both and one can stand in for the other
with nothing moving. A component indexes that scale at its own step name rather
than restating a number: a button's `sm`/`md`/`lg` icon is
`icon-sm`/`icon-md`/`icon-lg`. That is what makes the button's loading swap
free — see **Button**.

**It sizes more than glyphs.** A `Checkbox`'s square reads the same scale two
steps above its own tick, rather than minting `--spacing-checkbox-*`. The test
for that pins the *offset*, not the points — which is the difference between a
coupling that survives a retune and one that quietly stops holding.

A token is named for what it sizes, not for an abstract category, and a control
that shares another's heights gets its own namespace rather than borrowing one.
`Input` is the case this rule was written for: `--spacing-input-*` names the same
36/44/52 as `--spacing-button-*` rather than reading `h-button-md`, so a field
and the button beside it can be retuned independently. They are meant to stay
level, so `tokens.test.ts` asserts that outright — which is the difference
between a coupling that is checked and one that is merely hoped for.

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

**A navigator paints its own chrome from its own theme**, and nothing connects
that to these tokens. `expo-router` mounts its `NavigationContainer` with no
`theme`, so React Navigation's light default stands however dark the app is —
and on iOS the native stack hands `colors.background` to the
`UINavigationController`'s view, which is the slab visible between the cards
during a push and at their rounded corners. That layer is set from the theme
with no escape hatch, so a `contentStyle` in `screenOptions` cannot reach it;
only a theme fixes it.

`useNavigationTheme()` returns the six colours React Navigation's theme has,
resolved from these tokens, plus whether the active theme is dark. It returns
**plain values, not a `Theme`**, and imports nothing from a navigation library —
this package takes no navigation dependency, the same reason
`Screen.Navbar.BackButton` takes an `onPress` rather than calling a router. The
app spreads them over the framework's own base theme, which also supplies
`fonts`, whose shape is platform-specific and would drift if restated here.

`NavigationTheme` in `src/expo/` does the wiring — it is the one place
`expo-router` is imported, behind an optional peer (rule 4), so an app on a
different navigator uses the hook directly and skips it.

`dark` comes from Uniwind's active theme, never React Native's `useColorScheme`:
an app that lets the user force light or dark against the system setting would
otherwise theme its navigator the wrong way round. A slot resolving to nothing
is omitted rather than returned as `undefined`, so spreading the result cannot
punch a hole in the base theme.

The mapping lives in `lib/navigation-theme.ts`, free of React Native imports,
and a test asserts every token it names is declared in **both** variants of
`theme.css`. A slot pointing at a token no theme emits would resolve to
`undefined`, be dropped, and silently leave the light default in place — the
exact failure the hook exists to fix.

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

`src/display-name.test.ts` is the one test that reaches a `.tsx` at all, and it
does it by reading the file as **text** — walking `src/` with `node:fs`, matching
component declarations against `displayName` assignments, and importing nothing.
That is the move available whenever a convention is real but no renderer can
check it: assert against the source. `styles/tokens.test.ts` reads `tokens.css`
the same way.

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
   `{name}.types.ts` — see **Compound component layout**. Give every component
   in it a `DelacourUI.`-prefixed `displayName`, parts and providers included
   (rule 12).
2. Build interaction on `Pressable` — never on a bare `TouchableOpacity`.
3. Write the variant tests first where there is a `{name}.variants.ts` — that is
   the part `bun test` can reach. A colocated `tv()` has none, so state its rules
   in the doc comment and verify them on a simulator at step 5. `bun test` also
   fails with the name of any component still missing a `displayName`.
4. `bun run gen-exports`.
5. Render it in `apps/playground/src/app/(components)/{name}.tsx`, add a row for
   it to the `ListGroup` on `src/app/index.tsx`, and check it on a simulator.
   *A component with nothing to render skips this.* `DelacourProvider` has no
   gallery and no row: the playground's own `_layout.tsx` is its harness and
   every route in the app renders downstream of it, which is a stronger check
   than a readout page could be. Name the routes that prove each layer instead —
   `/pressable` for the gesture root, `/screen/navbar` for the insets,
   `/screen/form` for the keyboard.

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
	displayName: "DelacourUI.Button",
});
```

and every part file ends with its own, on the line after the closing brace:

```tsx
export function ButtonLabel({ className, ...props }: ButtonLabelProps): ReactElement { … }
ButtonLabel.displayName = "DelacourUI.Button.Label";
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
4. **`displayName` is required, on every component, and it is
   `DelacourUI.` + the component's dotted path in the public API.** React
   DevTools reads `displayName || name`, so without it every tree row, error
   stack and profiler entry reads `ButtonRoot`.

   ```
   DelacourUI.Button                 root
   DelacourUI.Button.Label           slot — the Object.assign key, verbatim
   DelacourUI.Input.Group            nested compound root
   DelacourUI.Input.Group.Prefix     nested slot
   DelacourUI.Text.Display           preset
   ```

   **Every** component takes one, not only the roots — a part, a context
   provider (`DelacourUI.Badge.Provider`, `DelacourUI.Text.ClassProvider`) and an
   internal leaf nobody imports (`DelacourUI.Spinner.Arc`,
   `DelacourUI.Screen.Footer.Background`) all appear in a DevTools tree, so all
   three need a name that says where they sit. A non-slot component dots under
   whatever owns it.

   There are two legal forms and no third. A root's goes **inside the
   `Object.assign`**; everything else takes a trailing statement on the line
   after its closing brace, as `button-label.tsx` does above and as the two
   `memo` consts in `screen/` do after their `});`. `Button.displayName = …`
   *after* the assign is a type error.

   Three names do not fall out of the rule mechanically. `DelacourProvider` is
   `DelacourUI.Provider`, because prefix-plus-symbol would stutter and this
   matches its export subpath. `ListGroup`'s slots keep the flat keys the assign
   gives them — `DelacourUI.ListGroup.ItemPrefix`, never `.Item.Prefix`. And
   `ScreenRoot` is named by the assign in `screen.tsx` rather than in
   `screen-root.tsx`, the one root that lives in a different file from its own
   compound surface — do not add a second assignment beside the declaration.

   `src/display-name.test.ts` enforces all of this. It reads the `.tsx` tree as
   source text rather than importing it, so it works where no renderer does; a
   new component fails `bun test` by name until it is named.
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

Wrap the app's root in `DelacourProvider` — the gesture root every `Pressable`
needs above it, the safe-area provider and the keyboard provider `Screen` reads,
and the keyboard state sync that keeps them honest:

```tsx
import { DelacourProvider } from "@delacour/native-ui/provider";

<DelacourProvider>{children}</DelacourProvider>;
```

Compose the four by hand only in an app that already has a root stack of its
own — and then `<KeyboardStateSync />` is required, not optional polish, and must
be a child of `KeyboardProvider`:

```tsx
import { KeyboardStateSync } from "@delacour/native-ui/hooks/use-keyboard-state-sync";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

<GestureHandlerRootView>
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <KeyboardProvider>
      <KeyboardStateSync />
      {children}
    </KeyboardProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>;
```

See **Screen** for what breaks without the state sync, and **DelacourProvider**
for why the safe-area provider is seeded and why the gesture root takes no
`style`.

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
