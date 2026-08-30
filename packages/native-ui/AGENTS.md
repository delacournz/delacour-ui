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
├── components/{name}/    one folder per component — see Components below
├── expo/                 Expo-only entry points — navigation-theme
├── hooks/                use-controllable-state, use-theme-color,
│                         use-keyboard-state-sync, use-navigation-theme
├── icons/central.ts      Central Icons re-export
├── lib/                  cn, tv, merge-props, compose-refs, slot, color,
│                         keyboard-animation, navigation-theme
├── styles/               index / base / tokens / theme CSS, plus tokens.ts
├── display-name.test.ts  The package-wide displayName check — see rule 12
├── docs.test.ts          The package-wide documentation check — see Testing
└── uniwind-env.d.ts      /// <reference types="uniwind/types" />
```

Everything belonging to a component — sub-components, variants, tests, local
hooks, helpers — lives in its folder and is re-exported from that `index.ts`.
Nothing outside reaches past the index into a component's internals.

**Each component folder holds its own `AGENTS.md`**, and that file is where the
component's design decisions live: its axes, what it refuses to do, and the
failure each rule prevents. It also carries the folder's file map, so the list
of parts is documented beside the parts rather than in a tree here that drifts
the moment a file is added. This document holds only what every component
shares.

## Components

| Component | Import | |
| --- | --- | --- |
| [Accordion](src/components/accordion/AGENTS.md) | `@delacour/native-ui/accordion` | Rows that each disclose a panel |
| [Badge](src/components/badge/AGENTS.md) | `@delacour/native-ui/badge` | A compact label for status, category or count |
| [BottomSheet](src/components/bottom-sheet/AGENTS.md) | `@delacour/native-ui/bottom-sheet` | A modal sheet, on `@gorhom/bottom-sheet` |
| [Button](src/components/button/AGENTS.md) | `@delacour/native-ui/button` | The reference implementation for the patterns below |
| [Checkbox](src/components/checkbox/AGENTS.md) | `@delacour/native-ui/checkbox` | A box that is ticked or not, alone or in a group |
| [Field](src/components/field/AGENTS.md) | `@delacour/native-ui/field` | A form field's layout, and where its state is written down |
| [Icon](src/components/icon/AGENTS.md) | `@delacour/native-ui/icon` | A Central Icon, with inherited size and colour |
| [Input](src/components/input/AGENTS.md) | `@delacour/native-ui/input` | A text field, and the box that holds content beside it |
| [ListGroup](src/components/list-group/AGENTS.md) | `@delacour/native-ui/list-group` | A surface grouping related rows |
| [Pressable](src/components/pressable/AGENTS.md) | `@delacour/native-ui/pressable` | The gesture primitive every other control is built on |
| [Radio](src/components/radio/AGENTS.md) | `@delacour/native-ui/radio` | One choice from a group |
| [Screen](src/components/screen/AGENTS.md) | `@delacour/native-ui/screen` | A screen's chrome, insets and scrollables |
| [Separator](src/components/separator/AGENTS.md) | `@delacour/native-ui/separator` | A one-pixel rule, hidden from assistive technology |
| [Slider](src/components/slider/AGENTS.md) | `@delacour/native-ui/slider` | A value, or a range, dragged along a track |
| [Spinner](src/components/spinner/AGENTS.md) | `@delacour/native-ui/spinner` | A rotating glyph, sharing the icon scale |
| [Switch](src/components/switch/AGENTS.md) | `@delacour/native-ui/switch` | A track and a knob, dragged or tapped |
| [Tabs](src/components/tabs/AGENTS.md) | `@delacour/native-ui/tabs` | A bar, a measured indicator and a swipeable pager |
| [Text](src/components/text/AGENTS.md) | `@delacour/native-ui/text` | The type scale, as twelve presets |
| [DelacourProvider](src/components/provider/AGENTS.md) | `@delacour/native-ui/provider` | The app's root layer stack |

A component missing from this table, or from its own folder, fails `bun test` —
see **Testing**.

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
| `--radius-button-*` | `rounded-button-md` | a button's corner, half its height — a capsule, and a circle when icon-only |
| `--spacing-input-*` | `h-input-md`, `min-h-input-md` | a field's height — fixed on one line, a floor when multiline |
| `--text-input-*` | `text-input-md` | a field's value, paired with its height |
| `--spacing-navbar-row` | `h-navbar-row` | the navbar's control row, without its safe-area band |
| `--spacing-screen-gutter` | `px-screen-gutter` | the gutter `Screen.Header`, `Screen.Navbar` and content share |

**`Icon` and `Spinner` share one scale.** `SPINNER_SIZES` *is* `ICON_SIZES`, so
`size="md"` is the same edge length in both and one can stand in for the other
with nothing moving. A component indexes that scale at its own step name rather
than restating a number: a button's `sm`/`md`/`lg` icon is
`icon-sm`/`icon-md`/`icon-lg`. That is what makes the button's loading swap
free — see [Button](src/components/button/AGENTS.md).

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
the same way, and `src/docs.test.ts` reads the folder tree.

`src/docs.test.ts` is why every component folder carries an `AGENTS.md`. It fails
by name for a folder with no doc, for a doc that is only a heading, and for a
component missing from the **Components** table above — because a doc nobody can
find is the same failure one step later. It exists because `Radio` shipped
exported, tested and rendered in the playground and stayed undocumented for
fifteen commits, while nine bullets in other components already pointed at rules
nobody had written down. Documentation belongs in the commit that changes the
code, and this is what holds that.

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
   in the doc comment and verify them on a simulator at step 6. `bun test` also
   fails with the name of any component still missing a `displayName`.
4. Write `src/components/{name}/AGENTS.md` — what the component is, its file
   map, its axes, and the reasoning behind each decision that is not obvious
   from the source. Add its row to the **Components** table above. `bun test`
   fails by name until both exist. Match the neighbouring files: a bullet opens
   with a bold claim and then explains the failure it prevents.
5. `bun run gen-exports`.
6. Write its demos in `apps/playground/src/demos/{name}/`, list them in that
   folder's `index.ts`, and render them from
   `apps/playground/src/app/(components)/{name}.tsx` — a six-line `DemoGallery`
   shell. Add a row for it to the `ListGroup` on `src/app/index.tsx`, and check
   it on a simulator. A demo is one file that becomes four things: the gallery
   section, the chrome-free capture frame, the published media and the
   documentation snippet — so the contract it has to satisfy is stricter than a
   gallery's was. It is written down in
   [`apps/playground/src/demos/AGENTS.md`](../../apps/playground/src/demos/AGENTS.md).
   `bun test` fails by name for a component with no demo.

   *A component with nothing to render skips this.* `DelacourProvider` has no
   demos and no row: the playground's own `_layout.tsx` is its harness and
   every route in the app renders downstream of it, which is a stronger check
   than a readout page could be. Name the routes that prove each layer instead —
   `/pressable` for the gesture root, `/screen/navbar` for the insets,
   `/screen/form` for the keyboard.

7. Mark four to six of those demos `capture`, one of them `hero`, and run
   `bun run previews` from the repo root to photograph them. That is what puts
   the component on the documentation site; a component with no captured demo
   shows a placeholder on the components index.

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
   `memo` consts and the `forwardRef` scrollables in `screen/` do after their
   `});`. `Button.displayName = …` *after* the assign is a type error.

   A `forwardRef` scrollable is cast to a hand-written component type to keep its
   generic, and that type declares `displayName?: string` for exactly this — see
   [Screen](src/components/screen/AGENTS.md).

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

Compose the five by hand only in an app that already has a root stack of its
own — and then `<KeyboardStateSync />` is required, not optional polish, and must
be a child of `KeyboardProvider`:

```tsx
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardStateSync } from "@delacour/native-ui/hooks/use-keyboard-state-sync";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

<GestureHandlerRootView>
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <KeyboardProvider>
      <KeyboardStateSync />
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </KeyboardProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>;
```

See [Screen](src/components/screen/AGENTS.md) for what breaks without the state
sync, and [DelacourProvider](src/components/provider/AGENTS.md) for why the
safe-area provider is seeded and why the gesture root takes no `style`.

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

## The registry

`packages/cli` derives a registry from this package's source — one item per
component folder — so the `delacour` CLI can copy components into someone
else's repository instead of them installing this package. Nothing about that
is maintained by hand: the files come from the folder, the dependency graph
comes from the imports, and the CLI's `classifySource` restates the same
conventions `scripts/gen-exports.ts` reads.

Two things follow for anyone adding to this package:

1. **A new component needs an entry in `packages/cli/src/registry/config.ts`.**
   `ITEM_META` holds its title and description. The builder throws without one
   rather than shipping an unnamed item.
2. **A new npm import needs classifying in the same file.** `PACKAGE_INSTALL`
   decides whether the CLI installs it with `expo install` (native modules and
   anything bound to the SDK) or with the project's package manager. An
   unclassified import fails the build — deliberately, because the default
   would be the one that installs a native module at a version the SDK cannot
   build.

Then run `bun --filter delacour run registry:build` and commit `registry/`. CI
fails if it is stale, since the registry is served straight out of the
repository.

`bun --filter delacour run verify:expo` is the check worth running before you
believe it: it scaffolds a real Expo app, adds every item, and typechecks the
result. A component whose imports only resolve inside this monorepo passes
`bun test` and fails there.

A component folder that follows the rules above needs nothing else. Relative
imports crossing a folder — `../icon`, `../../lib/cn` — are rewritten to
placeholders at build time and resolved to the consumer's own aliases at `add`
time, so write them exactly as you would anyway.
