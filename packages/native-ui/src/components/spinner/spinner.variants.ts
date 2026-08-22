import { tv } from "tailwind-variants";

export const SPINNER_SIZES = ["sm", "md", "lg"] as const;
export const SPINNER_COLORS = ["default", "success", "warning", "danger"] as const;

export type SpinnerSize = (typeof SPINNER_SIZES)[number];
export type SpinnerColor = (typeof SPINNER_COLORS)[number];

/** Edge length paired with each spinner size, in points. */
export const SPINNER_SIZE: Record<SpinnerSize, number> = {
	sm: 16,
	md: 24,
	lg: 32,
};

/** Theme token behind each named colour. */
export const SPINNER_COLOR_TOKEN: Record<SpinnerColor, string> = {
	default: "foreground",
	success: "success",
	warning: "warning",
	danger: "danger",
};

/** One full turn, in milliseconds, at speed 1. */
export const SPINNER_DURATION_MS = 900;

/** Edge length used with no `size` prop and nothing to inherit from. */
export const SPINNER_FALLBACK_SIZE = SPINNER_SIZE.md;

/** Named colour used with no `color` prop and nothing to inherit from. */
export const SPINNER_FALLBACK_COLOR: SpinnerColor = "default";

/**
 * Styling for the spinner root.
 *
 * The root carries no colour of its own: the glyph is an SVG stroke, which
 * takes a resolved value rather than a class. See {@link SPINNER_COLOR_TOKEN}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const spinnerVariants = tv({
	base: "items-center justify-center",
});

/** Styling for the rotating content. */
export const spinnerContentVariants = tv({
	base: "items-center justify-center",
});

function isSpinnerSize(size: SpinnerSize | number): size is SpinnerSize {
	return typeof size === "string";
}

/**
 * Edge length in points, from a named size, an explicit number, or an
 * inherited one.
 *
 * Precedence is explicit prop, then the enclosing component's icon size, then
 * the fallback — the same rule `Icon` follows, so a spinner composed into a
 * button matches that button without being told to.
 */
export function resolveSpinnerSize(size: SpinnerSize | number | undefined, inherited?: number): number {
	if (size === undefined) return inherited ?? SPINNER_FALLBACK_SIZE;
	return isSpinnerSize(size) ? SPINNER_SIZE[size] : size;
}

function isSpinnerColor(color: string): color is SpinnerColor {
	return (SPINNER_COLORS as readonly string[]).includes(color);
}

/**
 * Colour string to hand `useThemeColor`.
 *
 * A named colour maps through {@link SPINNER_COLOR_TOKEN}; anything else — a
 * theme token such as `muted-foreground`, or a literal `#EC4899` — passes
 * through untouched for the hook to resolve or pass on.
 *
 * Precedence matches {@link resolveSpinnerSize}: explicit prop, then the
 * inherited token, then the fallback.
 */
export function resolveSpinnerColor(color: string | undefined, inherited?: string): string {
	const value = color ?? inherited ?? SPINNER_FALLBACK_COLOR;
	return isSpinnerColor(value) ? SPINNER_COLOR_TOKEN[value] : value;
}
