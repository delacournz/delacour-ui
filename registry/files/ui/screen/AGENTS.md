# Screen

A screen's frame: pinned chrome, a content region, and whatever scrolls between
them. Compound root plus `Screen.Navbar` (itself compound), `Screen.Content`,
`Screen.View`, `Screen.Header`, `Screen.Footer`, four scrollables, and the two
whole-screen states.

`import { Screen } from "@registry/ui/screen";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@registry/ui/screen` |
| `screen.tsx` | The `Object.assign` compound surface |
| `screen-root.tsx` | The root box and its provider — see below for why it is split out |
| `screen-navbar.tsx` | `Screen.Navbar`, plus its own nested surface |
| `screen-navbar-title.tsx` | `Screen.Navbar.Title` |
| `screen-navbar-subtitle.tsx` | `Screen.Navbar.Subtitle` |
| `screen-navbar-back-button.tsx` | `Screen.Navbar.BackButton`, and `SCREEN_BACK_BUTTON_GLYPHS` |
| `screen-navbar-background.tsx` | The navbar's opaque backing and its bottom hairline — internal |
| `screen-content.tsx` | `Screen.Content` |
| `screen-view.tsx` | `Screen.View` |
| `screen-header.tsx` | `Screen.Header` |
| `screen-footer.tsx` | `Screen.Footer` |
| `screen-footer-background.tsx` | The footer's backing and its top hairline — internal |
| `screen-scroll-area.tsx` | `Screen.ScrollArea` |
| `screen-flat-list.tsx` | `Screen.FlatList` |
| `screen-section-list.tsx` | `Screen.SectionList` |
| `screen-legend-list.tsx` | `Screen.LegendList` |
| `screen-chat-list.tsx` | `Screen.ChatList` |
| `screen-loading.tsx` | `Screen.Loading` |
| `screen-error.tsx` | `Screen.Error` |
| `screen-list-component.tsx` | A list header/footer prop, as a node — internal |
| `screen-debug.ts` | `SCREEN_DEBUG_COLORS` |
| `screen.context.tsx` | `ScreenProvider`, `useScreen()`, `useScreenContext()`, `useScreenPart()`, `useScreenDebug()` |
| `screen.types.ts` | Prop types shared by two or more parts |
| `screen.variants.ts` | Pure `tv()` slots + the footer maths, no RN imports |
| `screen.variants.test.ts` | |
| `use-screen-scroll-insets.ts` | The reserve every scrollable shares |

## Design

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

## Reserves and occupancy

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

## Lists

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

## Debug

- **`<Screen debug>` paints every layer.** Opt-in per screen and deliberately
  *not* gated behind `__DEV__`, so a reserve can still be inspected on a release
  build. The green occupancy band's edge must land on the footer's red one; a red
  sliver past it means the reserve is short. `SCREEN_DEBUG_COLORS` is exported so
  a composer can paint matching bands. These are raw `rgba()` literals rather
  than theme tokens on purpose — a debug layer in a semantic colour would be
  invisible against the surface it sits on.

## Chrome

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

## API

- **There is no `Navbar.Action`.** [`Button`](../button/AGENTS.md) already owns that vocabulary —
  loading swap, icon inheritance, haptics, accessibility — so a navbar action is
  written as `<Button isIconOnly size="sm" variant="secondary">`. A second
  definition of props a component does not change is one that can drift.
- **`Screen.Navbar.BackButton` takes an `onPress`.** This library has no
  navigation dependency and must not gain one for a chevron. The app wires
  `router.back()`. `Screen.Footer`'s `isFocused` prop is the same trade: an app
  with a router passes `useIsFocused()`, and without one the footer behaves as
  focused.

## Structure

- **The root lives in `screen-root.tsx`, not `screen.tsx`.** `Screen.Loading`
  and `Screen.Error` are whole screens — they render the root — so putting it in
  the file that runs the `Object.assign` naming them would close a cycle. This is
  rule 3 applied inside a folder.
- **A nested `<Screen>` passes the outer context through** rather than shadowing
  it, so `Screen.Loading` returned from inside a screen does not start a second,
  unread set of measurements.

## Dependencies

- **One optional peer.** `@legendapp/list` is `peerDependenciesMeta.optional`,
  so an app that never imports `Screen` never resolves it.
  `react-native-keyboard-controller` used to be the second — see
  [DelacourProvider](../provider/AGENTS.md) for why it stopped.
- **The app must mount `DelacourProvider` at its root.** It supplies the gesture
  root, `SafeAreaProvider`, `KeyboardProvider` and — the one that is not optional
  polish — `<KeyboardStateSync />` inside the keyboard provider.
  `KeyboardProvider` owns exactly one pair of shared animation values for the
  whole app, and on iOS they are written only from the `will` events. Any
  teardown that skips one — an interactive dismiss interrupted by navigation, a
  stack pop, an app suspend — pins them open app-wide, and every screen then
  renders "keyboard open" over a keyboard that is not there. `Screen.Footer` runs
  the same repair on mount as a backstop.

