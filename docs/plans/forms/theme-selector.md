# ThemeSelector

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: `toggle-button` (group), `icon`, `text`, `field` (optional). Uniwind (existing peer). No new peers.

## Purpose on mobile
A settings control that switches the app between Light, Dark and System. It reflects the live theme (it never keeps a private copy), applies the choice through Uniwind by default, and can run in presentation-only mode so the app persists the preference itself.

## Behaviour reference (summary)
- Three options: system, light, dark; exactly one selected; selection shown with a ring/fill.
- Reads the live theme, so a change made elsewhere updates it immediately.
- `value` overrides what is shown as selected; `onValueChange` fires on press.
- `applyTheme` (default on) makes a press change the theme; off turns it into a pure presentation layer so the app can save then apply.
- Optional label heading, two looks, two sizes, disabled state; per-option label override.
- A hook exposes the current selection elsewhere in the app.
- Mode changes preserve the theme family unless switching to system (which resolves to the device's light or dark).

## How Uniwind sets a theme (verified in `node_modules/uniwind/src`)
- `Uniwind.setTheme(theme: ThemeName | "system")` (`core/config/config.common.ts`): `"system"` sets adaptive mode, follows `Appearance`, and calls `Appearance.setColorScheme(null)` on native; `"light"`/`"dark"` (or any registered custom theme name) sets it and pins `Appearance.setColorScheme` for adaptive names. An unregistered name throws.
- `useUniwind(): { theme: ThemeName; hasAdaptiveThemes: boolean }` (`hooks/useUniwind.ts`). `hasAdaptiveThemes === true` means "System" is selected and `theme` is the currently resolved light/dark.
- Therefore the selected option is derived: `hasAdaptiveThemes ? "system" : theme`. This is pure (`resolveSelectedMode`) and unit-testable.
- The playground has `apps/playground/src/components/theme-toggle.tsx` using `useUniwind` + its own `setThemeMode` store; the library does NOT import that. Persistence is the app's job (below).
- Custom theme families (names beyond light/dark, e.g. "house"): out of scope for v1 (see follow-ups); `value` type is the closed `ThemeMode` union.

## API

```ts
export type ThemeMode = "system" | "light" | "dark";
export const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];

export type ThemeSelectorProps = {
  /** Shown as selected instead of the live theme. Makes it presentation-controlled. */
  value?: ThemeMode;
  /** Fires on every press that changes the choice, AFTER the theme is applied when applyTheme. */
  onValueChange?: (mode: ThemeMode) => void;
  /**
   * Call Uniwind.setTheme on press. Default true. With false the component only
   * reports; the app saves and applies. This is the persistence seam: no storage
   * dependency lives here.
   */
  applyTheme?: boolean;
  /** Modes to offer and their order. Default ["system","light","dark"]. */
  modes?: readonly ThemeMode[];
  /** Per-option label overrides (i18n). */
  labels?: Partial<Record<ThemeMode, string>>;
  variant?: "segmented" | "cards";           // see Variants
  size?: "sm" | "md" | "lg";                 // ToggleButton sizes
  isDisabled?: boolean;                      // ?? Field.isDisabled
  haptic?: false | HapticFeedback;           // default "selection"
  className?: string;
  accessibilityLabel?: string;               // default "Theme"; ?? Field.label
  children?: ReactNode;                      // custom ThemeSelector.Option list
};

export type ThemeSelectorOptionProps = {
  value: ThemeMode;
  label?: string;
  icon?: IconComponent;                      // default per mode
};

export function useThemeSelection(): { mode: ThemeMode; resolved: "light" | "dark"; setMode: (mode: ThemeMode) => void };
```

Parts (Pattern B): `ThemeSelector` root, `ThemeSelector.Option` (renders one ToggleButton). With no children, root renders one `Option` per `modes`. Context: `ThemeSelectorContext { mode, setMode, variant, size, isDisabled, labels }`, hooks `useThemeSelector()` (throws outside), `useThemeSelectorContext()`.

```tsx
<ThemeSelector />

<ThemeSelector variant="cards" size="lg" labels={{ system: "Auto" }} />

// persisted preference, no storage dependency in the library
<ThemeSelector
  applyTheme={false}
  value={savedMode}
  onValueChange={(mode) => {
    savePreference(mode);          // MMKV / AsyncStorage / secure store: the app's choice
    Uniwind.setTheme(mode);
  }}
/>
```

`useThemeSelection` is a standalone hook (works with no component mounted) for custom UIs and for the app's boot code; paired with `Uniwind.setTheme(saved)` called once in the app root before first render to avoid a flash — documented as the recommended persistence recipe. A convenience pure helper `restoreThemeMode(saved: string | null | undefined): ThemeMode` (validates, falls back to "system") is exported so apps do not pass unknown strings to `setTheme` (which throws).

## Variants & sizes
- `segmented` (default): an `attached` single-selection `ToggleButton.Group` (`selectionMode single`, `isSelectionRequired`, `layout="attached"`), each toggle an `Icon` + `ToggleButton.Label`; toggle `variant="outline"`; sizes `sm|md|lg` map directly to the button steps. Full width (`flex-1` per option via `className` on each toggle, group `w-full`).
- `cards`: `layout="detached"` group; each option a larger toggle (`h-auto flex-col gap-2 py-3`) with a stylised mode glyph (Icon) above the label; selected shown by the toggle's pressed appearance plus `border-ring`. Fixed greys are NOT used (the reference uses miniature screen previews; here previews are a follow-up, see out of scope).
- Default icons (Central Icons, verified in the installed set): system `IconCircleHalfFill`, light `IconSun`, dark `IconMoon`. `themeSelectorVariants` holds `root`, `option`, `optionContent` per variant/size plus pure resolvers.

## States
default; selected (toggle pressed look; one always selected via `isSelectionRequired`); pressed (button feedback); disabled (group publishes `isDisabled`, members fade once); live-change (external theme change re-selects without remount); empty/invalid/loading/readOnly: n/a. Controlled `value` that disagrees with the live theme shows `value` (documented footgun; used with `applyTheme={false}`).

## Accessibility
- Container: `accessibilityRole="radiogroup"` and `accessibilityLabel` (ToggleButton single group already provides `radiogroup`; pass the label).
- Each option is a `radio` with `accessibilityState.selected` (from ToggleButton), label = option text (`System`, `Light`, `Dark`); icons `accessible={false}`.
- Announce on change is the native radio announcement; no extra live region.
- Min target 44pt at md/lg; `sm` uses `hitSlop`.

## Motion & haptics
- Haptic `selection` on press (`ToggleButton`'s `haptic` through the group), only when the choice actually changes (group already skips no-op presses).
- Visual: the whole app re-themes at once; the selector adds no motion of its own (matches the playground toggle's decision to avoid competing motion). Under `useCalmMotion` nothing changes (no decorative motion exists).
- Ordering: call `onValueChange` after `Uniwind.setTheme`, synchronously, so a persistence callback never races the repaint.

## Reuses / new internal pieces / peer deps
- Reuses: `ToggleButton` + `ToggleButton.Group` + `ToggleButton.Label` (import leaf files `../toggle-button/toggle-button`, `toggle-button-group`, `toggle-button-label`), `Icon`, `useFieldContext` (label/disabled), `useControllableState`-style derivation for `value` (value is derived-from-live when omitted, so not a plain controllable state: `value ?? live`).
- New: `theme-selector.logic.ts` (pure), `use-theme-selection.ts` (the only file importing `uniwind`; imports `useUniwind`, `Uniwind`).
- Peer deps: `uniwind` is already a peer of `@delacour/react-native-ui` (`^1.11.0`); registry `PACKAGE_INSTALL` must already carry it — verify, add no new entries. Because the CLI copies source into other repos, `use-theme-selection.ts` importing `uniwind` is acceptable (consumers of this library are Uniwind projects by definition).

## Files
```
theme-selector/
  AGENTS.md
  index.ts
  theme-selector.tsx           root + Object.assign (DelacourUI.ThemeSelector)
  theme-selector-option.tsx    DelacourUI.ThemeSelector.Option
  theme-selector.context.tsx
  theme-selector.types.ts
  theme-selector.logic.ts      pure (no RN, no uniwind)
  theme-selector.logic.test.ts
  theme-selector.variants.ts
  theme-selector.variants.test.ts
  use-theme-selection.ts       Uniwind binding + useThemeSelection
```

## Pure logic to unit-test
`theme-selector.logic.ts`:
- `resolveSelectedMode({ theme, hasAdaptiveThemes })`: (light,true) → system; (dark,true) → system; (light,false) → light; (dark,false) → dark; unknown custom theme name with adaptive off → falls back to resolved family via `resolveThemeFamily` (documented: returns "light" unless name includes/maps to dark; v1: `theme === "dark" ? "dark" : "light"`).
- `resolveThemeFamily(theme)`: "dark" → dark, anything else → light.
- `restoreThemeMode(saved)`: "dark"/"light"/"system" pass; null/undefined/"" → system; "Dark" (case) → system; "midnight" → system (never throws).
- `resolveNextMode({ current, pressed })`: same → `null` (no-op, mirrors group rule); different → pressed.
- `resolveOptions({ modes, labels })`: default order; custom subset/reorder; dedupes; empty list → defaults; label overrides applied, blank override ignored.
- `resolveModeLabel(mode, labels)` defaults "System"/"Light"/"Dark".
`theme-selector.variants.test.ts`: every variant×size emits root/option classes; `cards` option has `flex-col`, `segmented` does not; no raw palette, no `dark:`; the group props helper `resolveGroupProps(variant)` returns `layout: attached` for segmented and `detached` for cards, `selectionMode: single`, `isSelectionRequired: true`, and never `multiple`.

## Playground demos
`apps/playground/src/demos/theme-selector/`: `basic` (hero, capture, wired to live theme), `cards` (capture), `sizes` (capture), `custom-labels-modes` (two-option light/dark, labels), `persisted` (applyTheme false + in-memory store showing the recipe; capture), `in-field` (Field label + description; capture). Note: capture of dark/light variants relies on the preview harness theme; check `demos/AGENTS.md` for theme-forced capture.

## Docs page outline
Overview + hero; Usage; How it reads the theme (hasAdaptiveThemes); Presentation-only mode and persisting the preference (recipe with MMKV/AsyncStorage as examples, boot-time `restoreThemeMode` + `Uniwind.setTheme`); Variants; `useThemeSelection`; Accessibility; API tables.

## Out of scope / follow-ups
- Miniature screen previews (light/dark/diagonal-system thumbnails) as a third `variant="preview"`: needs fixed-grey art and per-theme demos; follow-up.
- Custom theme families beyond light/dark (e.g. selecting "house-dark"): requires a `ThemeMode` generic over `UniwindConfig["themes"]`; follow-up.
- Built-in persistence adapters (explicitly rejected: no storage dependency).
- Accent colour picker (belongs with ColorPicker/design-system).
- Registry: `ITEM_META` `theme-selector` (registryDependencies `toggle-button`, `icon`; optional `field`); `PACKAGE_INSTALL` verifies `uniwind` is present. Changeset minor for ui and delacour.

## Acceptance checklist
- [ ] Selected option derives from `useUniwind` (`hasAdaptiveThemes` => System), updates when theme changes elsewhere
- [ ] Press calls `Uniwind.setTheme(mode)`; `applyTheme={false}` skips it and still calls `onValueChange`
- [ ] `value` overrides display; exactly one option always selected; no-op press notifies nobody
- [ ] `restoreThemeMode` never lets an unknown string reach `setTheme`
- [ ] Built on `ToggleButton.Group` single + required; both variants work in light and dark
- [ ] radiogroup/radio semantics; labels localisable
- [ ] No storage dependency; no new peer
- [ ] Pure tests pass; AGENTS.md, package row, `gen-exports`, demos/route/index/`gen-demos`, docs mdx + meta.json, registry + `registry:build`, changeset
- [ ] No JSX comments, no `any`, displayNames `DelacourUI.ThemeSelector*`
