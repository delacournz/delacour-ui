const FUNCTIONAL_COLOR = /^[a-z][a-z-]*\(/i;

/**
 * True when a string is a literal CSS colour rather than a theme token name.
 *
 * Theme tokens (`foreground`, `danger-soft-foreground`, `emerald-500`) are
 * resolved through a CSS variable; literals are handed to the platform as-is.
 * The two are told apart by shape: a literal is either hex or a functional
 * notation, and no token name can look like either.
 */
export function isLiteralColor(value: string): boolean {
	return value.startsWith("#") || FUNCTIONAL_COLOR.test(value);
}
