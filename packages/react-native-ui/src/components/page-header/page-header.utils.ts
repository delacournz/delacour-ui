import { transparentOf } from "../../lib/color";

/** Drawn for a count that is not a count — `NaN`, or either infinity. An en dash, not a hyphen. */
const NOT_A_COUNT = "–";

/** Compact units, smallest first. */
const UNITS = [
	{ size: 1e3, suffix: "K" },
	{ size: 1e6, suffix: "M" },
	{ size: 1e9, suffix: "B" },
	{ size: 1e12, suffix: "T" },
] as const;

/**
 * A count, compacted for a stat's value: `1234` → `1.2K`, `1_250_000` → `1.3M`.
 *
 * One decimal at most, and a trailing `.0` dropped (`1K`, not `1.0K`). A value
 * that rounds to a thousand of one unit moves up to the next — `999_950` is
 * `1M`, never `1000K`. A negative count is drawn as `0` and anything that is not
 * a finite number as a dash.
 *
 * Hand-rolled because Hermes does not guarantee `Intl`'s compact notation, and a
 * stat that read `1234` on one platform and `1.2K` on another would be worse
 * than either. Rounding divides by a tenth of the unit rather than multiplying a
 * quotient by ten, so `1_150_000` rounds to `1.2M` instead of losing the half to
 * floating point. Visual only: what a screen reader hears is
 * {@link resolveStatLabel}.
 */
export function formatStatCount(value: number): string {
	if (!Number.isFinite(value)) return NOT_A_COUNT;
	if (value <= 0) return "0";

	const whole = Math.round(value);
	if (whole < 1000) return String(whole);

	for (const [index, unit] of UNITS.entries()) {
		const tenths = Math.round(value / (unit.size / 10));
		const isLast = index === UNITS.length - 1;
		if (tenths < 10_000 || isLast) {
			const units = tenths / 10;
			return `${Number.isInteger(units) ? units : units.toFixed(1)}${unit.suffix}`;
		}
	}

	return NOT_A_COUNT;
}

/**
 * What a screen reader hears for a stat: the full value, then its label.
 *
 * A number is read in full and grouped for the device's locale — `"1,234
 * Followers"` — never the compact string drawn on screen, because `"1.2K"` read
 * aloud is a worse answer to "how many?" than the number. A string is read as
 * given. A value with nothing to read leaves the label alone.
 */
export function resolveStatLabel(value: number | string, label: string): string {
	const spoken =
		typeof value === "number" ? (Number.isFinite(value) ? new Intl.NumberFormat().format(value) : "") : value.trim();
	return spoken ? `${spoken} ${label}` : label;
}

/**
 * The header avatar's spoken label, with verification appended.
 *
 * The rosette is drawn inside the avatar, which is one element to assistive
 * technology, so the only way a screen reader learns of it is through the
 * avatar's own label. `undefined` with neither a name nor a rosette, so a
 * nameless face stays unannounced the way a bare `Avatar` does.
 */
export function resolvePageHeaderAvatarLabel(name: string | undefined, isVerified: boolean): string | undefined {
	const trimmed = name?.trim();
	if (!isVerified) return trimmed || undefined;
	return trimmed ? `${trimmed}, verified` : "Verified";
}

/**
 * The cover gradient's stops, from the colours the theme resolved them to.
 *
 * The default is `primary` fading into the page: primary, then primary at zero
 * alpha over the cover's `bg-background` — never the keyword `transparent`,
 * which is transparent black and drags the fade through grey. When primary
 * arrives in a notation {@link transparentOf} cannot take apart, the far stop is
 * the page colour itself, which lands on the same picture.
 *
 * Caller colours are drawn as given, minus any that did not resolve. Fewer than
 * two left is no gradient at all — `null` — and the cover's own fill shows.
 */
export function resolvePageHeaderCoverStops({
	resolved,
	isDefault,
}: {
	resolved: readonly (string | undefined)[];
	isDefault: boolean;
}): readonly [string, string, ...string[]] | null {
	if (isDefault) {
		const [primary, background] = resolved;
		const far = transparentOf(primary) ?? background;
		return primary && far ? [primary, far] : null;
	}

	const [first, second, ...rest] = resolved.filter((color): color is string => color !== undefined);
	return first && second ? [first, second, ...rest] : null;
}

/**
 * Whether a text part's children would draw nothing — absent, a boolean, or only
 * whitespace — so the part can render nothing rather than leave a gap.
 *
 * A number is text, zero included. Anything else — an element — is taken at its
 * word. Typed as `unknown` so it stays free of React's types and reachable from
 * `bun test`.
 */
export function isEmptyText(children: unknown): boolean {
	if (children === undefined || children === null || typeof children === "boolean") return true;
	if (typeof children === "string") return children.trim() === "";
	if (Array.isArray(children)) return children.every(isEmptyText);
	return false;
}
