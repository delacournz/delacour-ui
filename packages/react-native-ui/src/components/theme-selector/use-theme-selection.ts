import { useCallback, useMemo } from "react";
import { Uniwind, useUniwind } from "uniwind";
import { resolveSelectedMode, resolveThemeFamily, type ThemeFamily, type ThemeMode } from "./theme-selector.logic";

/** What {@link useThemeSelection} returns. */
export type ThemeSelection = {
	/** The mode in force: `system` while the app follows the device. */
	mode: ThemeMode;
	/** What is on screen right now — `system` resolved to light or dark. */
	resolved: ThemeFamily;
	/** Applies a mode through `Uniwind.setTheme`. Stores nothing. */
	setMode: (mode: ThemeMode) => void;
};

/**
 * Applies a mode to the whole app.
 *
 * `Uniwind.setTheme("system")` hands the theme back to the device; `light` and
 * `dark` pin it. Module scope, so `setMode` is one stable function for every
 * caller.
 */
function applyThemeMode(mode: ThemeMode): void {
	Uniwind.setTheme(mode);
}

/**
 * The live theme as a selector mode, and a way to change it.
 *
 * Reads Uniwind rather than keeping a copy, so a change made anywhere — another
 * selector, the app's boot code, the device switching to dark at dusk while on
 * System — re-renders every caller at once. Works with no `ThemeSelector`
 * mounted, for a custom control or a settings row that only shows the current
 * choice.
 *
 * Nothing is persisted. Uniwind forgets its theme on restart, so an app that
 * remembers the choice stores it and calls `Uniwind.setTheme(restoreThemeMode(saved))`
 * once at boot, before the first render.
 *
 * This is the only module in the component that imports `uniwind`.
 *
 * @example
 * const { mode, resolved, setMode } = useThemeSelection();
 */
export function useThemeSelection(): ThemeSelection {
	const { theme, hasAdaptiveThemes } = useUniwind();
	const mode = resolveSelectedMode({ hasAdaptiveThemes, theme });
	const resolved = resolveThemeFamily(theme);
	const setMode = useCallback((next: ThemeMode) => applyThemeMode(next), []);

	return useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
}
