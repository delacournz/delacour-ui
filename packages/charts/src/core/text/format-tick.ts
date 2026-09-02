import type { ScaleType } from "../scale/scale.types";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/**
 * A number as a tick label.
 *
 * Rounded to twelve significant figures before printing, which is what turns
 * `0.30000000000000004` back into `0.3`. Floating-point noise is not
 * hypothetical on an axis: it is what `0.1 + 0.2` looks like, and a tick
 * generator that divides a domain produces it routinely.
 */
export function formatNumberTick(value: number): string {
	if (!Number.isFinite(value)) return "";
	if (Number.isInteger(value)) return String(value);
	return String(Number(value.toPrecision(12)));
}

/**
 * An epoch millisecond as a tick label, at a granularity the span deserves.
 *
 * Deliberately not `Intl`. It is unavailable inside a worklet, its output
 * varies with the device locale in ways a screenshot test cannot pin, and a
 * chart axis wants the shortest unambiguous label rather than a correct
 * regional one. A caller who needs real localisation passes their own
 * formatter — that is what the prop is for.
 */
export function formatDateTick(value: number, spanMs: number): string {
	if (!Number.isFinite(value)) return "";
	const date = new Date(value);

	if (spanMs < DAY) {
		return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}
	if (spanMs < YEAR) {
		return `${date.getDate()} ${MONTHS[date.getMonth()] ?? ""}`;
	}
	if (spanMs < 4 * YEAR) {
		return `${MONTHS[date.getMonth()] ?? ""} ${String(date.getFullYear()).slice(2)}`;
	}
	return String(date.getFullYear());
}

/** The formatter a scale kind gets when the caller supplies none. */
export function defaultTickFormat(kind: ScaleType, spanMs: number): (value: number) => string {
	if (kind !== "time") return formatNumberTick;
	return (value) => formatDateTick(value, spanMs);
}

function pad(value: number): string {
	return value < 10 ? `0${value}` : String(value);
}

/**
 * A categorical axis' labels, read at the datum index each tick names.
 *
 * The subtlety that makes this a function rather than an inline closure: a
 * categorical tick's **value** is the datum's index, and that is not the same
 * as the tick's own position in the tick list. Six months downsampled to four
 * ticks leaves values `[0, 2, 3, 5]`; formatting by the tick's ordinal would
 * print `Jan Feb Mar Apr` against bars standing at Jan, Mar, Apr and Jun — an
 * axis that is wrong in a way nothing about it looks wrong.
 */
export function categoricalTickFormat(raw: readonly unknown[]): (value: number) => string {
	return (value) => {
		const index = Math.round(value);
		if (index < 0 || index >= raw.length) return "";
		return String(raw[index] ?? "");
	};
}
