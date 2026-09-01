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
 * An explicit value also overrides `--radius-button-*`, which is otherwise
 * outside the ramp — see `applyButtonRadius` in `./resolve`. Without that, this
 * axis silently did not apply to buttons: Sera sets a flat 0 corner, so picking
 * Small rounded every surface and left the buttons square.
 */

export type RadiusName = "default" | "none" | "small" | "medium" | "large";

export type Radius = {
	name: RadiusName;
	title: string;
	/** Points, or `null` for `default` — see above. Never a `"0.625rem"` string. */
	value: number | null;
};

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
