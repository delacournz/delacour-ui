const FUNCTIONAL_COLOR = /^[a-z][a-z-]*\(/i;

/**
 * True when a string is a literal CSS colour rather than a theme token name.
 *
 * Theme tokens (`foreground`, `destructive-soft-foreground`, `emerald-500`) are
 * resolved through a CSS variable; literals are handed to the platform as-is.
 * The two are told apart by shape: a literal is either hex or a functional
 * notation, and no token name can look like either.
 */
export function isLiteralColor(value: string): boolean {
	return value.startsWith("#") || FUNCTIONAL_COLOR.test(value);
}

/** The `--color-` prefix this package used before it adopted shadcn's names. */
const LEGACY_PREFIX = "--color-";

/**
 * The CSS variable a token name resolves to.
 *
 * The raw name, not the `--color-*` one: `theme.css` maps raw onto `--color-*`
 * through `@theme inline`, and `inline` means Tailwind substitutes the value
 * into each utility and emits no `--color-*` variable at all. Only the raw
 * names exist at runtime.
 *
 * A `--color-*` argument is rewritten rather than rejected — it is what a
 * caller wrote before this package took shadcn's names, and left alone it would
 * miss silently on every render.
 *
 * Pure, and separate from `useThemeColor` so it is reachable from `bun test` —
 * the hook imports `uniwind`, which Bun's transpiler cannot parse. See AGENTS.md.
 */
export function themeVariableName(token: string): string {
	if (token.startsWith(LEGACY_PREFIX)) return `--${token.slice(LEGACY_PREFIX.length)}`;
	if (token.startsWith("--")) return token;

	return `--${token}`;
}
