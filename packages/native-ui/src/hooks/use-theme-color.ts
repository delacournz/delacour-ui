import { useCSSVariable } from "uniwind";

/**
 * Reads a theme colour as a plain string for props that take a colour value
 * rather than a style — icon `color`, gradient stops, chart series, and any
 * third-party component that will not accept a className.
 *
 * Resolves against the nearest `ScopedTheme`, so it follows light/dark and any
 * custom theme automatically. Prefer a `bg-*`/`text-*` className wherever the
 * target actually accepts one.
 */
export function useThemeColor(token: string): string | undefined {
	const name = token.startsWith("--") ? token : `--color-${token}`;
	return useCSSVariable(name) as string | undefined;
}
