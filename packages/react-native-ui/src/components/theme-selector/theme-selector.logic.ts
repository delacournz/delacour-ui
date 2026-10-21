/**
 * The pure decisions behind `ThemeSelector`: which mode is selected, what a
 * press changes, what a stored string restores to and which options to draw.
 *
 * Imports neither React Native nor Uniwind, so a unit test reaches all of it.
 * `use-theme-selection.ts` is the one file that binds these to the live theme.
 * See AGENTS.md.
 */

/** The three choices a theme selector offers. */
export const THEME_MODES = ["system", "light", "dark"] as const;

/** `system` follows the device; `light` and `dark` pin the app to one. */
export type ThemeMode = (typeof THEME_MODES)[number];

/** What `system` resolves to at any moment, and the family a pinned theme belongs to. */
export type ThemeFamily = "light" | "dark";

/** Each mode's label, before any override. */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
	system: "System",
	light: "Light",
	dark: "Dark",
};

/** Per-mode label overrides, for localisation. */
export type ThemeModeLabels = Partial<Record<ThemeMode, string>>;

/** One option the selector draws. */
export type ThemeOption = { mode: ThemeMode; label: string };

/** Whether a value is one of the three modes — exactly, case and all. */
export function isThemeMode(value: unknown): value is ThemeMode {
	return typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);
}

/**
 * The light-or-dark family of a theme name.
 *
 * `dark` is dark and everything else is light. A custom theme name — `house`,
 * say — is not a mode this selector offers, so it lands on light rather than on
 * nothing; selecting a custom family is a follow-up.
 */
export function resolveThemeFamily(theme: string): ThemeFamily {
	return theme === "dark" ? "dark" : "light";
}

/**
 * The mode a live theme amounts to.
 *
 * Uniwind reports "following the device" as `hasAdaptiveThemes`, and `theme` as
 * whatever that currently resolved to — so adaptive is System, whichever of light
 * or dark is showing. A pinned theme is its own family.
 */
export function resolveSelectedMode({
	theme,
	hasAdaptiveThemes,
}: {
	theme: string;
	hasAdaptiveThemes: boolean;
}): ThemeMode {
	return hasAdaptiveThemes ? "system" : resolveThemeFamily(theme);
}

/**
 * A stored preference, made safe to hand to `Uniwind.setTheme`.
 *
 * `setTheme` throws on a name it was not given, so a value read back from
 * storage — absent, from an older build, hand-edited — must never reach it
 * unchecked. Anything that is not exactly a mode falls back to `system`, the one
 * choice that is always right for a device. Never throws.
 */
export function restoreThemeMode(saved: string | null | undefined): ThemeMode {
	return isThemeMode(saved) ? saved : "system";
}

/**
 * The mode a press moves to, or `null` for no change.
 *
 * A re-press of the selected option changes nothing, and `null` rather than the
 * same mode back means nobody is notified of a value they already hold — the
 * rule `ToggleButton.Group` and `Radio.Group` keep. A value that is not a mode is
 * no change either.
 */
export function resolveNextMode({
	current,
	pressed,
}: {
	current: ThemeMode;
	pressed: string | undefined;
}): ThemeMode | null {
	if (!isThemeMode(pressed) || pressed === current) return null;
	return pressed;
}

/** A mode's label: the override when it holds text, otherwise the default. */
export function resolveModeLabel(mode: ThemeMode, labels?: ThemeModeLabels): string {
	const override = labels?.[mode];
	return override !== undefined && override.trim() !== "" ? override : THEME_MODE_LABELS[mode];
}

/**
 * The options to draw, in order, with their labels.
 *
 * `modes` picks and orders them; a duplicate keeps its first place, and an empty
 * list means every mode — a selector with nothing to select would be a control
 * that cannot hold the value it is showing.
 */
export function resolveOptions({
	modes,
	labels,
}: {
	modes?: readonly ThemeMode[];
	labels?: ThemeModeLabels;
}): ThemeOption[] {
	const unique = [...new Set(modes ?? THEME_MODES)];
	const picked = unique.length > 0 ? unique : THEME_MODES;
	return picked.map((mode) => ({ label: resolveModeLabel(mode, labels), mode }));
}

/**
 * The `testID` an option drawn by the root carries: the selector's own, then
 * `-` and the mode — `appearance-dark`.
 *
 * Without it a test, or a capture flow, could find the group but not the option
 * to press. No selector `testID`, no option `testID`.
 */
export function resolveOptionTestID(testID: string | undefined, mode: ThemeMode): string | undefined {
	return testID ? `${testID}-${mode}` : undefined;
}
