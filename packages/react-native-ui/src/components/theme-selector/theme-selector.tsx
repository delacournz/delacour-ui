import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { useFieldContext } from "../field/field.context";
import type { HapticFeedback } from "../pressable";
import { ToggleButton } from "../toggle-button";
import { type ThemeSelectorContextValue, ThemeSelectorProvider } from "./theme-selector.context";
import {
	isThemeMode,
	resolveNextMode,
	resolveOptions,
	resolveOptionTestID,
	type ThemeMode,
	type ThemeModeLabels,
} from "./theme-selector.logic";
import {
	resolveGroupProps,
	type ThemeSelectorSize,
	type ThemeSelectorVariant,
	themeSelectorVariants,
} from "./theme-selector.variants";
import { ThemeSelectorOption } from "./theme-selector-option";
import { useThemeSelection } from "./use-theme-selection";

export type ThemeSelectorProps = {
	/** Shown as selected instead of the live theme. Pair with `applyTheme={false}`. */
	value?: ThemeMode;
	/** Called with the new mode on every press that changes it — after the theme is applied. */
	onValueChange?: (mode: ThemeMode) => void;
	/**
	 * Apply the mode through `Uniwind.setTheme` on press. Default `true`. Off, the
	 * selector only reports, and the app stores and applies the choice itself.
	 */
	applyTheme?: boolean;
	/** The modes to offer, in order. Default `["system", "light", "dark"]`. */
	modes?: readonly ThemeMode[];
	/** Per-mode label overrides, for localisation. */
	labels?: ThemeModeLabels;
	/** `segmented` joins the options into one run; `cards` stands them apart as tiles. Default `segmented`. */
	variant?: ThemeSelectorVariant;
	/** The button's label steps. Default `md`. */
	size?: ThemeSelectorSize;
	/** Disables every option. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Played when the choice changes. Default `selection`; `false` silences it. */
	haptic?: false | HapticFeedback;
	className?: string;
	/** The group's accessible name. Default the enclosing `Field.Label`'s text, then "Theme". */
	accessibilityLabel?: string;
	/** The group's testID. Each option drawn from `modes` takes it plus `-<mode>`. */
	testID?: string;
	/** Custom `ThemeSelector.Option`s. Without them, one option is drawn per `modes`. */
	children?: ReactNode;
};

function ThemeSelectorRoot({
	value,
	onValueChange,
	applyTheme = true,
	modes,
	labels,
	variant = "segmented",
	size = "md",
	isDisabled,
	haptic = "selection",
	className,
	accessibilityLabel,
	testID,
	children,
}: ThemeSelectorProps): ReactElement {
	const field = useFieldContext();
	const live = useThemeSelection();
	const applyMode = live.setMode;
	const mode = value ?? live.mode;
	const resolvedIsDisabled = isDisabled ?? field?.isDisabled ?? false;

	// The theme moves first and the caller hears second, synchronously, so a
	// handler that persists the choice never races the repaint it is recording.
	const setMode = useCallback(
		(pressed: ThemeMode) => {
			const next = resolveNextMode({ current: mode, pressed });
			if (next === null) return;
			if (applyTheme) applyMode(next);
			onValueChange?.(next);
		},
		[applyMode, applyTheme, mode, onValueChange]
	);

	const handleSelected = useCallback(
		(selected: string[]) => {
			const pressed = selected[0];
			if (isThemeMode(pressed)) setMode(pressed);
		},
		[setMode]
	);

	const context = useMemo<ThemeSelectorContextValue>(
		() => ({ isDisabled: resolvedIsDisabled, labels, mode, setMode, size, variant }),
		[labels, mode, resolvedIsDisabled, setMode, size, variant]
	);

	const selected = useMemo(() => [mode], [mode]);
	const group = resolveGroupProps(variant);

	const options =
		children ??
		resolveOptions({ labels, modes }).map((option) => (
			<ThemeSelectorOption
				key={option.mode}
				label={option.label}
				testID={resolveOptionTestID(testID, option.mode)}
				value={option.mode}
			/>
		));

	return (
		<ThemeSelectorProvider value={context}>
			<ToggleButton.Group
				{...group}
				accessibilityLabel={accessibilityLabel ?? field?.label ?? "Theme"}
				className={themeSelectorVariants({ size, variant }).root({ className })}
				haptic={haptic}
				isDisabled={resolvedIsDisabled}
				onSelected={handleSelected}
				selected={selected}
				size={size}
				testID={testID}
				variant="outline"
			>
				{options}
			</ToggleButton.Group>
		</ThemeSelectorProvider>
	);
}

/**
 * Switches the app between System, Light and Dark.
 *
 * It reads the live theme rather than keeping a copy — System is selected while
 * Uniwind follows the device — so a change made anywhere else moves it too. A
 * press applies the mode through `Uniwind.setTheme` and then calls
 * `onValueChange`.
 *
 * Nothing is stored. To remember the choice, turn `applyTheme` off, show the
 * saved mode with `value`, and in `onValueChange` save it and apply it yourself;
 * at boot, `Uniwind.setTheme(restoreThemeMode(saved))` before the first render.
 *
 * Built on a single, required `ToggleButton.Group`: the group is a
 * `radiogroup` and each option a `radio`, so a screen reader announces the
 * choice. Inside a `Field` it takes the field's disabled state and its label as
 * the group's name.
 *
 * @example
 * <ThemeSelector />
 *
 * @example
 * <ThemeSelector labels={{ system: "Auto" }} size="lg" variant="cards" />
 *
 * @example
 * <ThemeSelector
 *   applyTheme={false}
 *   onValueChange={(mode) => {
 *     savePreference(mode);
 *     Uniwind.setTheme(mode);
 *   }}
 *   value={savedMode}
 * />
 */
export const ThemeSelector = Object.assign(ThemeSelectorRoot, {
	/** One choice: a toggle with the mode's glyph and label. */
	Option: ThemeSelectorOption,
	displayName: "DelacourUI.ThemeSelector",
});
