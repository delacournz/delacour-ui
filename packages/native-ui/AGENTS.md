# native-ui — Shared React Native Components

A standalone React Native component library. Styling is Uniwind (Tailwind v4 for
React Native); interaction is Reanimated + Gesture Handler; haptics are Pulsar.

This library has no relationship to, and takes no dependency on, any third-party
React Native component kit. Do not add one, and do not port patterns from one.

## Stack

- **Uniwind** — Tailwind v4 for React Native (`className` on RN components)
- **tailwind-variants** (`tv`) — variant systems
- **react-native-reanimated** — UI-thread animation
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
│   ├── separator/
│   └── spinner/
│       ├── index.ts              → @delacour/native-ui/spinner
│       ├── spinner.tsx           Root + the Object.assign compound surface
│       ├── spinner-content.tsx   Spinner.Content, the rotating layer
│       ├── spinner-arc.tsx       The default arc glyph
│       ├── spinner.context.tsx   SpinnerContext, useSpinner(), useSpinnerContext()
│       ├── spinner.variants.ts   Pure tv() slots + resolvers, no RN imports
│       └── spinner.variants.test.ts
├── hooks/            use-controllable-state, use-theme-color
├── icons/central.ts  Central Icons re-export
├── lib/              cn, tv, merge-props, compose-refs, slot
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

**C — `tv()` variants.** Size and variant axes defined in a `*.variants.ts`
sibling, never inline in the component. Example: `button.variants.ts`.

A component with more than one styled part uses **one slotted `tv()`**, so a
shared axis is declared once rather than restated per part. `Button`,
`ListGroup` and `Spinner` all do. `Separator` stays flat because it has a single
element, and `Pressable` holds no `tv()` at all — see its section for why.

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

## Separator

A one-pixel rule, hidden from assistive technology — a line between every row
carries nothing a screen reader can use, and announcing them buries the rows.

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
`@testing-library/react-native` needs a Jest transform. This is why variant
definitions live in `*.variants.ts` files free of React Native imports.

Rendering is verified in `apps/playground` on a simulator. If render tests
become necessary, add `jest-expo` to the playground rather than to this package.

This is also why a component's pure decisions belong in its `*.variants.ts`
rather than inline in the `.tsx` — `resolveButtonLayout`, `resolveIconSizeClass`
and `resolveSpinnerRootClass` live there so the whole matrix is reachable from
`bun test`.

## Adding a component

1. `src/components/{name}/{name}.tsx`, plus `{name}.variants.ts` if it has
   variants, plus an `index.ts` re-exporting the component and its types. A
   compound component adds one file per part, a `{name}.context.tsx` and a
   `{name}.types.ts` — see **Compound component layout**.
2. Build interaction on `Pressable` — never on a bare `TouchableOpacity`.
3. Write the variant tests first; they are the part `bun test` can reach.
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
