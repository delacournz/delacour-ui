import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ThemeMode, ThemeModeLabels } from "./theme-selector.logic";
import type { ThemeSelectorAxes } from "./theme-selector.types";

export type ThemeSelectorContextValue = ThemeSelectorAxes & {
	/** The mode shown as selected — `value` when given, the live theme otherwise. */
	mode: ThemeMode;
	/** What a press does: applies the mode unless `applyTheme` is off, then reports it. */
	setMode: (mode: ThemeMode) => void;
	/** Per-mode label overrides the root was given. */
	labels: ThemeModeLabels | undefined;
};

const ThemeSelectorContext = createContext<ThemeSelectorContextValue | null>(null);

/**
 * Supplies one selector's state to its options.
 *
 * Lives in its own module, importing nothing but React and types, so an option
 * can read it without importing `./theme-selector` and closing a cycle
 * (AGENTS.md rule 3).
 */
export function ThemeSelectorProvider({
	value,
	children,
}: {
	value: ThemeSelectorContextValue;
	children: ReactNode;
}): ReactElement {
	return <ThemeSelectorContext value={value}>{children}</ThemeSelectorContext>;
}
ThemeSelectorProvider.displayName = "DelacourUI.ThemeSelector.Provider";

/** The enclosing selector's state, or null outside a `<ThemeSelector>`. */
export function useThemeSelectorContext(): ThemeSelectorContextValue | null {
	return use(ThemeSelectorContext);
}

/**
 * Reads the enclosing selector's state.
 *
 * For a custom option that has to match the selector it sits in. Throws outside
 * one — use {@link useThemeSelectorContext} where the selector is optional, or
 * `useThemeSelection` for the live theme with no selector at all.
 */
export function useThemeSelector(): ThemeSelectorContextValue {
	const context = useThemeSelectorContext();
	if (!context) {
		throw new Error("useThemeSelector must be called inside a <ThemeSelector>.");
	}
	return context;
}

/**
 * The enclosing selector's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useThemeSelectorPart(component: string): ThemeSelectorContextValue {
	const context = useThemeSelectorContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <ThemeSelector>.`);
	}
	return context;
}
