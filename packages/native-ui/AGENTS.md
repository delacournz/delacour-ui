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
│   │   ├── button.tsx            Root, compound parts
│   │   ├── button.context.tsx    ButtonContext, useButton(), useButtonContext()
│   │   ├── button.variants.ts    Pure tv() definitions, no RN imports
│   │   └── button.variants.test.ts
│   ├── icon/
│   ├── list-group/
│   │   ├── index.ts              → @delacour/native-ui/list-group
│   │   ├── list-group.tsx        Root, Item and the five Item slots
│   │   ├── list-group.context.tsx  ListGroupContext, useListGroup()
│   │   ├── list-group.variants.ts  Pure tv() + feedback map, no RN imports
│   │   └── list-group.variants.test.ts
│   ├── pressable/
│   │   ├── index.ts              → @delacour/native-ui/pressable
│   │   ├── pressable.tsx         The Gesture API primitive
│   │   ├── pressable.variants.ts   Shared feedback vocabulary, no RN imports
│   │   └── pressable.variants.test.ts
│   ├── separator/
│   └── spinner/
│       ├── index.ts              → @delacour/native-ui/spinner
│       ├── spinner.tsx           Root, Spinner.Content, default arc glyph
│       ├── spinner.variants.ts   Pure tv() + resolvers, no RN imports
│       └── spinner.variants.test.ts
├── hooks/            use-controllable-state, use-theme-color
├── icons/central.ts  Central Icons re-export
├── lib/              cn, merge-props, compose-refs, slot
├── styles/           index / base / tokens / theme CSS
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
Reach for this over adding boolean props.

**C — `tv()` variants.** Size and variant axes defined in a `*.variants.ts`
sibling, never inline in the component. Example: `button.variants.ts`.

## Rules

1. **Text colour goes on the `Text`, never the parent.** A React Native `View`
   does not cascade colour to a `Text` descendant the way a DOM element does.
   `buttonLabelVariants` owns `text-*`; `buttonVariants` must not.
2. **No `"use client"`.** That is an RSC directive; it means nothing here.
3. **No package-wide barrel.** Import from the subpath:
   `@delacour/native-ui/button`. This is what lets an app skip resolving
   optional peers it never uses. A component folder's own `index.ts` is its
   entry point, not a barrel — never add a top-level `src/index.ts`.

   *One exception, and it exists to prevent a cycle:* a **leaf** module —
   `button.context.tsx`, `button.variants.ts` — may be imported directly across
   component folders. `Spinner` reads the button's context, and `Button` renders
   a `Spinner`; if `spinner.tsx` imported `../button`, that index would pull
   `button.tsx` straight back in. Metro serves a partially initialised module
   for a cycle, so `ButtonContext` would be `undefined` at import time and the
   app would red-box on a cold start. Do not "tidy" these imports back to
   `../button`.
4. **Run `bun run gen-exports`** after adding or removing a component folder or
   a file under `src/hooks`, `src/lib`, or `src/icons`. Never hand-edit the
   `exports` map. A component folder without an `index.ts` fails the script.
5. **Central Icons only**, via `@delacour/native-ui/icons/central`.
6. **Never wrap a React Native or Reanimated component with `withUniwind`.**
   `View`, `Text`, `Pressable`, `Animated.View` and friends already accept
   `className`. `withUniwind` is only for third-party components (`expo-image`,
   `expo-blur`), and a given component may only be wrapped once, in one file.
7. **Native modules are peer dependencies, never dependencies.** Two copies of
   a native module register twice and break at runtime.
8. **`cn()` for every caller-supplied `className`.** Uniwind does not
   deduplicate conflicting utilities on its own.
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
  `IconDefaultsProvider` carrying `BUTTON_ICON_SIZE[size]` and
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
- **`feedback`**: `scale` (default) or `none` — a deliberate subset of the
  pressable vocabulary, narrowed with `Extract` so a rename there cannot leave
  it behind. Press feedback on a button is the spring scale and nothing else.
  **Do not add ripple, ink, glow or highlight overlays** — no wash layers on
  pressables in this library.
- **`isLoading`** composes a `Spinner` in and blocks presses. Placement is
  `spinnerPlacement`: `start` (default), `end`, or `only` — which drops the
  children and collapses the button to the same square footprint as
  `isIconOnly`, carrying the label onto `accessibilityLabel` so a screen reader
  still has a name to read.
- **Loading is not disabled.** `isLoading` blocks the press and announces the
  button as *busy*, but keeps full contrast: the spinner already says the press
  landed, and dimming reads as "this control is unavailable". `isDimmedWhileLoading`
  opts into the faded treatment where a caller wants it.
- **The width snap while loading is deliberate.** There is no layout animation:
  Pressable's `Animated.View` already runs a `useAnimatedStyle` on `opacity` and
  `transform`, and a native layout transition on the same view fights it for
  prop ownership. A caller who needs a stable width pins it (`w-full`, `min-w-*`).

## Spinner

An animated loading indicator. Compound root plus `Spinner.Content`, the part
that rotates.

- **Sizes**: `sm`/`md`/`lg` (16/24/32pt), or an explicit number.
  **Colours**: `default`, `success`, `warning`, `danger`, plus any token the
  theme emits (`primary-foreground`, `muted-foreground`) or a literal
  (`#EC4899`). A Tailwind palette name like `emerald-500` only resolves if some
  utility class already pulled that variable into the build — otherwise the
  token is unresolved and nothing is drawn. Prefer the semantic tokens.
- **Size and colour are inherited, not passed.** Inside a `Button` the spinner
  reads that button's context and comes out at its icon size in its variant's
  foreground; elsewhere it falls back to the nearest `IconDefaultsProvider`,
  then to `md` on `foreground`. An explicit `size` or `color` always wins — the
  same precedence `Icon` follows.
- **Any child is the glyph**, wrapped in a `Spinner.Content` automatically so it
  still rotates. Write `Spinner.Content` out by hand only to set a `speed`.
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
- **`feedback`**: the full `PressableFeedback` vocabulary, forwarded straight to
  `Pressable` — the row picks a different default, it does not own a second
  mapping. `fade` is that default, because a full-bleed row that scales reads as
  the whole card flexing rather than as one row responding.
- **Icons are composed, never passed as props.** `ItemPrefix` wraps its subtree
  in an `IconDefaultsProvider` carrying `LIST_GROUP_ICON_SIZE[size]` and
  `foreground`, so a bare `<Icon icon={IconUser} />` needs nothing said at the
  call site. `ItemSuffix` draws a chevron when it has no children of its own;
  `iconProps` tunes that glyph and is ignored once it does.
- **String children** are wrapped in an `ItemContent` around an `ItemTitle`
  automatically, consecutive strings collapsing into one — the same rule, and
  the same reason, as `Button`.
- **Title colour goes on the title.** `listGroupItemVariants` carries no
  `text-*`; a row is a `View` and cannot cascade colour to a `Text`. The tests
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

## Theming

Tokens are CSS variables under `@variant light` / `@variant dark` in
`src/styles/theme.css`. Components reference semantic names — `bg-background`,
`text-muted-foreground` — and never a raw palette colour or a `dark:` prefix;
the variable swap handles the theme. For a prop that needs a colour *value*
rather than a class (an icon's `color`, a gradient stop), use `useThemeColor`.

## Testing

`bun test` covers **pure logic only**: `cn`, `mergeProps`, `composeRefs`, and
the `tv()` variant functions. It cannot render components — React Native ships
Flow-typed source that Bun's transpiler cannot parse, and
`@testing-library/react-native` needs a Jest transform. This is why variant
definitions live in `*.variants.ts` files free of React Native imports.

Rendering is verified in `apps/playground` on a simulator. If render tests
become necessary, add `jest-expo` to the playground rather than to this package.

This is also why a component's pure decisions belong in its `*.variants.ts`
rather than inline in the `.tsx` — `resolveButtonLayout` and `resolveSpinnerSize`
live there so the whole matrix is reachable from `bun test`.

## Adding a component

1. `src/components/{name}/{name}.tsx`, plus `{name}.variants.ts` if it has
   variants, plus an `index.ts` re-exporting the component and its types.
2. Build interaction on `Pressable` — never on a bare `TouchableOpacity`.
3. Write the variant tests first; they are the part `bun test` can reach.
4. `bun run gen-exports`.
5. Render it in `apps/playground/src/app/(components)/{name}.tsx`, add a row for
   it to the `ListGroup` on `src/app/index.tsx`, and check it on a simulator.

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
