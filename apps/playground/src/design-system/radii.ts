/**
 * The corner scale, as one number.
 *
 * `--radius` is the only geometry token the whole generic corner ramp is
 * derived from — `tokens.css` builds `--radius-xs` through `--radius-4xl` as
 * multipliers of it, so setting this one value rounds or squares every edge in
 * the app at once. shadcn's model exactly, and the reason it ports so cleanly.
 *
 * `default` carries no value on purpose: it means "whatever the style chose",
 * so the axis can be left alone without pinning the style's own corner. Every
 * other option overrides it.
 *
 * Buttons included, and that is new. A button used to read `--radius-button-*`,
 * a token pinned at half its height, so it was the one control this axis could
 * not move: picking Small rounded every surface and left Sera's buttons square.
 * `Button` is `rounded-lg` now — the ramp's 1.0 step, the way shadcn's is — so
 * the single number below reaches it like everything else.
 */

export type RadiusName = "default" | "none" | "small" | "medium" | "large";

export type Radius = {
	name: RadiusName;
	title: string;
	/** Points, or `null` for `default` — see above. Never a `"0.625rem"` string. */
	value: number | null;
};

/** shadcn's own four, in px: `0`, `0.45rem`, `0.625rem` — its default — and `0.875rem`. */
export const RADII: readonly Radius[] = [
	{ name: "default", title: "Default", value: null },
	{ name: "none", title: "None", value: 0 },
	{ name: "small", title: "Small", value: 7.2 },
	{ name: "medium", title: "Medium", value: 10 },
	{ name: "large", title: "Large", value: 14 },
];

export function radiusByName(name: string): Radius | undefined {
	return RADII.find((radius) => radius.name === name);
}
