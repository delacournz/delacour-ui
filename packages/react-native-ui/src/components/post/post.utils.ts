/**
 * Post's pure, non-styling logic — counts, times, the tokenised body and the
 * spoken labels.
 *
 * Free of React Native imports so it stays unit-testable — it must not
 * pull in React Native's Flow-typed source. See AGENTS.md.
 */

const COMPACT_UNITS = [
	{ size: 1e3, suffix: "K" },
	{ size: 1e6, suffix: "M" },
	{ size: 1e9, suffix: "B" },
	{ size: 1e12, suffix: "T" },
] as const;

/** Rounds half away from zero to one decimal place, without `toFixed`'s binary drift. */
function roundToTenth(value: number): number {
	return Math.round(value * 10 + Number.EPSILON) / 10;
}

/**
 * A count as a feed prints it: `1234` is `1.2K`, `12345` is `12K`.
 *
 * One decimal below ten of a unit, none above, and a value that rounds up to a
 * thousand of one unit is promoted to the next — `999_999` is `1M`, never
 * `1000K`. NaN and the infinities print `0`: a broken count should read as
 * nothing rather than as `NaN` in a stranger's feed.
 */
export function formatCompactCount(n: number): string {
	if (!Number.isFinite(n)) return "0";
	const sign = n < 0 ? "-" : "";
	const abs = Math.abs(n);
	if (abs < 1000) return `${sign}${Math.round(abs)}`;

	for (let index = 0; index < COMPACT_UNITS.length; index++) {
		const unit = COMPACT_UNITS[index] as (typeof COMPACT_UNITS)[number];
		const scaled = abs / unit.size;
		const rounded = scaled < 10 ? roundToTenth(scaled) : Math.round(scaled);
		const isLast = index === COMPACT_UNITS.length - 1;
		if (rounded < 1000 || isLast) {
			return `${sign}${String(rounded)}${unit.suffix}`;
		}
	}
	return "0";
}

/**
 * An integer with thousands separators: `1234` is `1,234`.
 *
 * Written by hand rather than through `toLocaleString`, whose output depends on
 * the engine's ICU build — the spoken label must read the same on every device.
 */
export function formatGroupedNumber(n: number): string {
	if (!Number.isFinite(n)) return "0";
	const sign = n < 0 ? "-" : "";
	const digits = String(Math.round(Math.abs(n)));
	return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTHS_LONG = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** `3 minutes ago`, `1 hour ago`. */
function spokenAgo(count: number, unit: string): string {
	return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/** A relative time, printed and spoken. */
export type RelativeTime = {
	/** What the card shows: `now`, `3m`, `2d`, `Oct 5`. */
	short: string;
	/** What a screen reader says: `just now`, `3 minutes ago`, `October 5`. */
	spoken: string;
};

/**
 * How long ago a post was made, the way a feed prints it — and the words a
 * screen reader should say instead of `3m`.
 *
 * A future date reads as `now`: a device clock a few minutes ahead of the
 * server must never print `-3m`. Past a week the date itself is printed, with
 * the year only when it is not `now`'s. Local calendar, because that is the
 * calendar the reader lives in.
 */
export function formatRelativeTime(date: Date, now: Date): RelativeTime {
	const time = date.getTime();
	if (Number.isNaN(time) || Number.isNaN(now.getTime())) return { short: "", spoken: "" };

	const elapsed = now.getTime() - time;
	if (elapsed < MINUTE_MS) return { short: "now", spoken: "just now" };
	if (elapsed < HOUR_MS) {
		const minutes = Math.floor(elapsed / MINUTE_MS);
		return { short: `${minutes}m`, spoken: spokenAgo(minutes, "minute") };
	}
	if (elapsed < DAY_MS) {
		const hours = Math.floor(elapsed / HOUR_MS);
		return { short: `${hours}h`, spoken: spokenAgo(hours, "hour") };
	}
	if (elapsed < WEEK_MS) {
		const days = Math.floor(elapsed / DAY_MS);
		return { short: `${days}d`, spoken: spokenAgo(days, "day") };
	}

	const month = date.getMonth();
	const day = date.getDate();
	const year = date.getFullYear() === now.getFullYear() ? "" : `, ${date.getFullYear()}`;
	return { short: `${MONTHS_SHORT[month]} ${day}${year}`, spoken: `${MONTHS_LONG[month]} ${day}${year}` };
}

/** One run of a post's body. `raw` is the source text; `value` is what a handler receives. */
export type BodyToken =
	| { type: "text"; value: string }
	| { type: "tag"; value: string; raw: string }
	| { type: "mention"; value: string; raw: string }
	| { type: "link"; value: string; raw: string };

const TAG_PATTERN = /#([\p{L}\p{N}_]+)/uy;
const MENTION_PATTERN = /@([\p{L}\p{N}_]+)/uy;
const LINK_PATTERN = /https?:\/\/[^\s]+/y;
const HAS_LETTER = /\p{L}/u;
const LINK_TRAILING = /[.,!?;:)\]}'"]+$/;
const BOUNDARY = /[\s([{]/;

/** The token starting at `index`, when one does. */
function matchAt(body: string, index: number): Exclude<BodyToken, { type: "text" }> | null {
	const char = body[index];
	if (char === "#") {
		TAG_PATTERN.lastIndex = index;
		const match = TAG_PATTERN.exec(body);
		const value = match?.[1];
		if (match && value && HAS_LETTER.test(value)) return { type: "tag", value, raw: match[0] };
		return null;
	}
	if (char === "@") {
		MENTION_PATTERN.lastIndex = index;
		const match = MENTION_PATTERN.exec(body);
		const value = match?.[1];
		if (match && value) return { type: "mention", value, raw: match[0] };
		return null;
	}
	if (char === "h") {
		LINK_PATTERN.lastIndex = index;
		const match = LINK_PATTERN.exec(body);
		if (!match) return null;
		const url = match[0].replace(LINK_TRAILING, "");
		if (url.length <= "https://".length) return null;
		return { type: "link", value: url, raw: url };
	}
	return null;
}

/**
 * Splits a post's body into plain text, `#tags`, `@mentions` and links.
 *
 * A token only starts at the beginning of the body or after whitespace or an
 * opening bracket, which is what keeps `email@x.com` and `a#b` plain text. A tag
 * needs at least one letter (`#123` is a number, not a tag) and takes any
 * script's letters; it ends at the first character that is not a letter, digit
 * or underscore, so `#a#b` is the tag `a` and then the text `#b`. A link drops
 * trailing sentence punctuation, so the full stop after a URL is not part of it.
 *
 * Lossless: joining each token's `raw` (or a text token's `value`) rebuilds the
 * body exactly. Adjacent text is merged into one run.
 */
export function tokenizePostBody(body: string): BodyToken[] {
	const tokens: BodyToken[] = [];
	let text = "";
	let index = 0;

	while (index < body.length) {
		const atBoundary = index === 0 || BOUNDARY.test(body[index - 1] as string);
		const token = atBoundary ? matchAt(body, index) : null;
		if (token) {
			if (text) tokens.push({ type: "text", value: text });
			text = "";
			tokens.push(token);
			index += token.raw.length;
			continue;
		}
		const codePoint = body.codePointAt(index) ?? 0;
		const char = String.fromCodePoint(codePoint);
		text += char;
		index += char.length;
	}
	if (text) tokens.push({ type: "text", value: text });
	return tokens;
}

/**
 * A stat's accessibility label: the noun and the number together, `Like, 216`.
 *
 * Built from the raw number and grouped, so `1.2K` is spoken as `1,234` rather
 * than "one point two K". On/off is not in the words — it lives in
 * `accessibilityState.selected`, which VoiceOver reads as "selected" itself. A
 * string value the same as the label (`Save`) is not said twice.
 */
export function resolvePostStatLabel(label: string, value: number | string | undefined, _active: boolean): string {
	if (value === undefined || value === "") return label;
	if (typeof value === "number") return `${label}, ${formatGroupedNumber(value)}`;
	return value === label ? label : `${label}, ${value}`;
}

/** The label of a vote group: `Score 1,240`. */
export function resolveVotesLabel(score: number | string): string {
	return `Score ${typeof score === "number" ? formatGroupedNumber(score) : score}`;
}

/**
 * What a screen reader says for an author: name, handle, verified, and the time
 * as words — `Aria, @aria, verified, 3 minutes ago` — never `3m`.
 */
export function resolveAuthorA11yLabel(input: {
	name: string;
	handle?: string;
	verified: boolean;
	spokenTime: string;
}): string {
	const parts = [input.name];
	if (input.handle) parts.push(input.handle);
	if (input.verified) parts.push("verified");
	if (input.spokenTime) parts.push(input.spokenTime);
	return parts.join(", ");
}

/** The clamp a body renders with, and which toggle it offers. */
export type BodyClamp = {
	numberOfLines: number | undefined;
	showMore: boolean;
	showLess: boolean;
};

/**
 * Whether a body is clamped and which toggle it shows.
 *
 * A toggle only appears on an `expandable` body that actually overflows — a
 * short post offers no "more" to tap into nothing. Expanded drops the clamp
 * entirely and offers "less".
 */
export function resolveBodyClamp(input: {
	numberOfLines?: number;
	expandable: boolean;
	isTruncated: boolean;
	isExpanded: boolean;
}): BodyClamp {
	if (!input.expandable || input.numberOfLines === undefined) {
		return { numberOfLines: input.numberOfLines, showMore: false, showLess: false };
	}
	if (input.isExpanded) return { numberOfLines: undefined, showMore: false, showLess: true };
	return { numberOfLines: input.numberOfLines, showMore: input.isTruncated, showLess: false };
}
