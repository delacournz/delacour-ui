import { useCSSVariable } from "uniwind";
import { isLiteralColor } from "../lib/color";

/**
 * Reads a theme colour as a plain string for props that take a colour value
 * rather than a style — icon `color`, gradient stops, chart series, and any
 * third-party component that will not accept a className.
 *
 * Resolves against the nearest `ScopedTheme`, so it follows light/dark and any
 * custom theme automatically. Prefer a `bg-*`/`text-*` className wherever the
 * target actually accepts one.
 *
 * A literal colour — `#EC4899`, `rgb(...)` — passes straight through, so a
 * caller can hand one to any prop typed as a token without special-casing it.
 * A token resolves only if the active theme actually emits its CSS variable.
 * That is the semantic palette in `styles/theme.css` — Tailwind's own palette
 * names (`emerald-500`) are not emitted unless some utility class references
 * them. An unresolved token yields `undefined` rather than a bogus value.
 */
export function useThemeColor(token: string): string | undefined {
	const name = token.startsWith("--") ? token : `--color-${token}`;
	const resolved = useCSSVariable(name) as string | undefined;
	return resolved ?? (isLiteralColor(token) ? token : undefined);
}
