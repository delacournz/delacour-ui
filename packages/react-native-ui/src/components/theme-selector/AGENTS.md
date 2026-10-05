# ThemeSelector

A settings control that switches the app between System, Light and Dark.
Compound root plus `ThemeSelector.Option`, and a standalone `useThemeSelection()`
hook for the live theme with no selector mounted.

`import { ThemeSelector } from "@delacour/react-native-ui/theme-selector";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/theme-selector` |
| `theme-selector.tsx` | Root + the `Object.assign` compound surface |
| `theme-selector-option.tsx` | `ThemeSelector.Option`, and each mode's default glyph |
| `theme-selector.context.tsx` | `ThemeSelectorProvider`, `useThemeSelector()`, `useThemeSelectorContext()` |
| `theme-selector.types.ts` | `ThemeSelectorAxes`, shared by the root and the context |
| `theme-selector.logic.ts` | Pure mode logic — no React Native, no Uniwind |
| `theme-selector.logic.test.ts` | |
| `theme-selector.variants.ts` | The slotted `tv()` and the group/hit-slop resolvers |
| `theme-selector.variants.test.ts` | |
| `use-theme-selection.ts` | `useThemeSelection()` — the only file importing `uniwind` |

## Design

- **Variants**: `segmented` (default), `cards`. **Sizes**: `sm`, `md`, `lg` —
  the button's label steps; an option always carries text, so the square `icon-*`
  steps are not offered. **Modes**: `system`, `light`, `dark`, closed.
- **The selection is read, never kept.** `useUniwind()` reports the resolved
  theme and `hasAdaptiveThemes`, and `resolveSelectedMode` turns that into a
  mode: adaptive is System, whichever of light or dark is showing. There is no
  state in the component, so a change made anywhere else — another selector, the
  app's boot code, the device flipping at dusk while on System — re-selects every
  mounted selector without a remount. A private copy would be a second source of
  truth that drifts the first time the theme moves without it.
- **`value` overrides what is shown, and that is all it does.** `value ?? live`,
  not `useControllableState`: an uncontrolled selector has nothing to hold
  because the theme is already held. A `value` that disagrees with the live
  theme shows `value` — the point of it is `applyTheme={false}`, where the app's
  stored preference is the truth until the app applies it.
- **No storage, on purpose — `applyTheme` is the persistence seam.** Uniwind
  forgets its theme on restart, and remembering it means picking a store (MMKV,
  AsyncStorage, a secure store) that this package has no business choosing. With
  `applyTheme={false}` a press only reports, and the app saves then calls
  `Uniwind.setTheme` itself. At boot, `Uniwind.setTheme(restoreThemeMode(saved))`
  before the first render, from a synchronous store, avoids a frame of the wrong
  palette.
- **`restoreThemeMode` exists because `setTheme` throws.** Uniwind throws on a
  theme name it was not given, so a stored string — absent, from an older build,
  hand-edited, `"Dark"` — must never reach it unchecked. Anything that is not
  exactly a mode becomes `system`, the one choice that is right for any device.
- **The theme moves first, then the caller hears.** `onValueChange` runs after
  `Uniwind.setTheme`, synchronously in the same press, so a handler persisting
  the choice never races the repaint it is recording.
- **A no-op press notifies nobody.** The group is `single` with
  `isSelectionRequired`, so a re-press of the selected option is already no
  change, and `resolveNextMode` returns `null` for it besides — the rule
  `ToggleButton.Group` and `Radio.Group` keep.
- **It is a `ToggleButton.Group`, not a new segmented control.**
  `resolveGroupProps` is the whole mapping: `segmented` is an `attached` run
  (one `Button.Group`, shared corners, a hairline seam) and `cards` is
  `detached`, each tile keeping its own corners. Every option is an `outline`
  toggle, so the off and on paint, the press feedback, the haptic and the
  disabled fade are the toggle's, and there is no second colour table here.
- **A selected card is the toggle's own pressed look, with no extra ring.** A
  `border-ring` on top would be the one colour this component owned, and the
  toggle's rule is that it owns no paint — a second selection cue drawn here is
  how the two would stop matching. The filled tile already reads as chosen.
- **Every option is `flex-1`, so the selector fills its parent.** A theme row
  sits in a settings list, and three options of different widths read as three
  different weights of choice. A card overrides the button's fixed height with
  `h-auto`, stacks the glyph over the label, and draws the glyph a step or two
  up the icon scale so the tile has a figure.
- **System, Light and Dark draw `IconCircleHalfFill`, `IconSun` and
  `IconMoon`.** Central Icons, like everything here. The glyph is decoration —
  the option's label is what a screen reader announces.
- **Accessibility comes from the toggle.** A `single` group is a `radiogroup`
  and each option a `radio` with `accessibilityState.selected`, so the native
  radio announcement is the change announcement; nothing else is added. The
  group is named by `accessibilityLabel`, else the enclosing `Field.Label`'s
  text, else "Theme". `sm` is 36pt tall, so it reaches 4pt further each way
  (`resolveOptionHitSlop`) to make 44.
- **Labels are localisable, and a blank one is ignored.** `labels` overrides per
  mode, `Option`'s own `label` overrides that; an empty or whitespace override
  falls back to the default rather than drawing an unlabelled radio.
- **`modes` picks and orders; it cannot empty the control.** A duplicate keeps
  its first place and an empty list means all three, because a selector with no
  option could not show the mode the app is in.
- **No motion of its own.** The whole app re-themes at once when an option is
  pressed; anything the selector animated would compete with that. The
  playground's navbar toggle made the same call. `useCalmMotion` therefore has
  nothing to turn off.
- **An option drawn from `modes` is addressable.** The root's `testID` names
  the group, and each option it draws takes that plus `-<mode>`
  (`resolveOptionTestID`) — a test or a capture flow that could find the group
  but not the option to press would record a still screen.
- **Joins `Field`.** Inside `<Field isDisabled>` every option disables with
  nothing said at the call site; an explicit `isDisabled` still wins.
- **`useThemeSelection` is usable on its own.** It returns `{ mode, resolved,
  setMode }` and needs no selector mounted, for a custom control or a settings
  row that only shows the current choice. Its `setMode` applies and stores
  nothing.
- **Light and dark only, for now.** A pinned custom theme name — `house`, say —
  resolves to its family through `resolveThemeFamily` (`dark` is dark, anything
  else light) rather than to nothing. Selecting a custom family needs `ThemeMode`
  to be generic over Uniwind's registered themes, and is a follow-up, as is a
  third `preview` variant drawing miniature screens.
