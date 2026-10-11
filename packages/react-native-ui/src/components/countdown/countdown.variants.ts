import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The units a countdown can show, largest first. The order is load-bearing — see {@link resolveCountdownUnits}. */
export const COUNTDOWN_UNITS = ["days", "hours", "minutes", "seconds"] as const;

export type CountdownUnit = (typeof COUNTDOWN_UNITS)[number];

/** How much time is left, in each selected unit. An unselected unit reads zero. */
export type CountdownParts = Record<CountdownUnit, number>;

export const COUNTDOWN_SIZES = ["sm", "md", "lg"] as const;
export type CountdownSize = (typeof COUNTDOWN_SIZES)[number];

export const COUNTDOWN_VARIANTS = ["segmented", "inline"] as const;
export type CountdownVariant = (typeof COUNTDOWN_VARIANTS)[number];

export const COUNTDOWN_DEFAULT_SIZE: CountdownSize = "md";
export const COUNTDOWN_DEFAULT_VARIANT: CountdownVariant = "segmented";

/** Seconds in one of each unit. */
const UNIT_SECONDS: Record<CountdownUnit, number> = {
	days: 86_400,
	hours: 3_600,
	minutes: 60,
	seconds: 1,
};

/** The caption under each segmented box when the caller names none. */
export const COUNTDOWN_DEFAULT_LABELS: Record<CountdownUnit, string> = {
	days: "Days",
	hours: "Hours",
	minutes: "Minutes",
	seconds: "Seconds",
};

/** The unit's spoken noun, singular and plural, when the caller names none. */
const SPOKEN_UNITS: Record<CountdownUnit, readonly [string, string]> = {
	days: ["day", "days"],
	hours: ["hour", "hours"],
	minutes: ["minute", "minutes"],
	seconds: ["second", "seconds"],
};

/**
 * The `Text` preset the digits take at each size — one step up the type scale per size. Not a
 * `Text.Display` / `.Title` / `.Header` preset component: those announce as headings, and a
 * countdown's digits are hidden from assistive technology behind the root's coarse label.
 */
export const COUNTDOWN_DIGIT_TEXT_VARIANT = {
	sm: "header",
	md: "title",
	lg: "display",
} as const satisfies Record<CountdownSize, "header" | "title" | "display">;

/** The most a digit grows with the OS text size inside a segmented box, whose padding is fixed. */
export const COUNTDOWN_MAX_FONT_SIZE_MULTIPLIER = 1.5;

/** How long a changed digit takes to slide out and its replacement to slide in. */
export const COUNTDOWN_DIGIT_SLIDE_MS = 220;

/**
 * Styling for a countdown.
 *
 * - `root` — the row: segmented boxes with a gap, or the inline run's container.
 * - `segment` — one segmented box: `bg-muted`, `rounded-md`, padding stepping with `size`.
 * - `digits` — the row of digit columns inside a box.
 * - `digit` — one column, clipped so a sliding digit never paints outside its own slot.
 * - `value` — the digit text: `tabular-nums` so a `1` is as wide as an `8` and the row never
 *   jitters on a tick, and `text-destructive` once urgent. Colour sits on the `Text`, never the
 *   box (rule 1).
 * - `caption` — the unit's label beneath a box.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const countdownVariants = tv({
	slots: {
		root: "flex-row items-start",
		segment: "items-center rounded-md border-continuous bg-muted",
		digits: "flex-row",
		digit: "overflow-hidden",
		value: "text-foreground tabular-nums",
		caption: "",
	},
	variants: {
		variant: {
			segmented: {},
			inline: {},
		},
		size: {
			sm: { segment: "min-w-12 px-2 py-1.5", caption: "text-xs" },
			md: { segment: "min-w-16 px-3 py-2" },
			lg: { segment: "min-w-20 px-4 py-3" },
		},
		isUrgent: {
			true: { value: "text-destructive" },
			false: {},
		},
	},
	compoundVariants: [
		{ variant: "segmented", size: "sm", class: { root: "gap-1.5" } },
		{ variant: "segmented", size: "md", class: { root: "gap-2" } },
		{ variant: "segmented", size: "lg", class: { root: "gap-3" } },
	],
	defaultVariants: {
		isUrgent: false,
		size: COUNTDOWN_DEFAULT_SIZE,
		variant: COUNTDOWN_DEFAULT_VARIANT,
	},
});

export type CountdownVariantProps = VariantProps<typeof countdownVariants>;

/**
 * The target as epoch milliseconds. An invalid `Date` or a non-finite number reads as the epoch —
 * long past — so a bad target shows a finished countdown rather than `NaN` digits.
 */
export function toEpochMs(to: Date | number): number {
	const ms = typeof to === "number" ? to : to.getTime();
	return Number.isFinite(ms) ? ms : 0;
}

/**
 * Whole seconds left, **rounded up** and never negative. Rounding up is what keeps `0:01` on
 * screen through the final second and shows `0:00` only once time is actually up.
 */
export function secondsUntil(to: Date | number, now: number): number {
	return Math.max(0, Math.ceil((toEpochMs(to) - now) / 1000));
}

/**
 * The selected units, deduplicated and ordered largest first, however they were listed. None, or
 * an empty list, selects all four.
 */
export function resolveCountdownUnits(units: readonly CountdownUnit[] | undefined): readonly CountdownUnit[] {
	if (units === undefined || units.length === 0) return COUNTDOWN_UNITS;
	return COUNTDOWN_UNITS.filter((unit) => units.includes(unit));
}

/**
 * Splits seconds into the selected units.
 *
 * **The largest selected unit absorbs everything above it** — hours and minutes show 48 h for two
 * days rather than dropping the days on the floor. **The smallest rounds up**, the same rule as
 * {@link secondsUntil}: hours and minutes with 30 s left read `0:01`, never a `0:00` that claims
 * time is up while it is not.
 */
export function splitCountdown(seconds: number, units: readonly CountdownUnit[]): CountdownParts {
	const selected = resolveCountdownUnits(units);
	const parts: CountdownParts = { days: 0, hours: 0, minutes: 0, seconds: 0 };
	const smallest = UNIT_SECONDS[selected[selected.length - 1] ?? "seconds"];
	let left = Math.ceil(Math.max(0, seconds) / smallest) * smallest;
	for (const unit of selected) {
		const size = UNIT_SECONDS[unit];
		parts[unit] = Math.floor(left / size);
		left -= parts[unit] * size;
	}
	return parts;
}

/**
 * The units actually drawn. With `trim`, leading units reading zero are dropped — `2d 00:03` is
 * not news — but never below the smallest two selected, so the last minute still reads `0:59`
 * rather than a lone `59` that could be anything.
 */
export function trimCountdownUnits(
	parts: CountdownParts,
	units: readonly CountdownUnit[],
	trim: boolean
): readonly CountdownUnit[] {
	const selected = resolveCountdownUnits(units);
	if (!trim) return selected;
	const floor = Math.min(2, selected.length);
	let start = 0;
	while (start < selected.length - floor && parts[selected[start] as CountdownUnit] === 0) start++;
	return selected.slice(start);
}

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

/**
 * The inline run: `2d 14:03:22`, `14:03:22`, `3:22`. Days lead with a `d` suffix; the rest are
 * colon-joined, and every unit after the first is padded to two digits.
 */
export function formatCountdownInline(parts: CountdownParts, visible: readonly CountdownUnit[]): string {
	const [first, ...rest] = visible;
	if (first === undefined) return "";
	if (first === "days") {
		const clock = rest.map((unit) => pad(parts[unit])).join(":");
		return clock.length > 0 ? `${parts.days}d ${clock}` : `${parts.days}d`;
	}
	return [String(parts[first]), ...rest.map((unit) => pad(parts[unit]))].join(":");
}

/**
 * One segmented box's digits, padded to two. An absorbing unit keeps every digit it has — 2881
 * minutes is four columns — so nothing is ever cut off.
 */
export function countdownDigits(value: number): readonly string[] {
	return pad(value).split("");
}

function spokenUnit(unit: CountdownUnit, value: number, labels: Partial<Record<CountdownUnit, string>>): string {
	const label = labels[unit];
	if (label !== undefined) return `${value} ${label}`;
	const [one, many] = SPOKEN_UNITS[unit];
	return `${value} ${value === 1 ? one : many}`;
}

/**
 * What a screen reader hears — coarse on purpose, so it does not chatter every second.
 *
 * Above one minute it names days, hours and minutes and leaves seconds out, so it changes at most
 * once a minute; within the final minute it counts seconds. It follows absorption, leaves zero
 * units out, and names a unit with the caller's label when there is one. Without seconds
 * selected, the final minute reads as one minute — rounding up, as the digits do.
 */
export function resolveCountdownAccessibilityLabel(
	seconds: number,
	units: readonly CountdownUnit[],
	labels: Partial<Record<CountdownUnit, string>> = {}
): string {
	if (seconds <= 0) return "Time is up";
	const selected = resolveCountdownUnits(units);
	const coarse = seconds < 60 && selected.includes("seconds") ? selected : selected.filter((u) => u !== "seconds");
	const spoken = coarse.length > 0 ? coarse : selected;
	const floored = spoken.includes("seconds") ? seconds : Math.max(60, Math.floor(seconds / 60) * 60);
	const parts = splitCountdown(floored, spoken);
	const words = spoken.filter((unit) => parts[unit] > 0).map((unit) => spokenUnit(unit, parts[unit], labels));
	return `${words.join(", ")} left`;
}

/**
 * Milliseconds until the seconds left next change — the next whole-second boundary of `to - now`,
 * not a fixed interval from whenever the timer happened to start — or `null` once time is up.
 * Re-reading the wall clock and re-aligning on every tick is what keeps the countdown from
 * drifting, and from lying after the JavaScript thread stalls.
 */
export function msUntilNextTick(to: Date | number, now: number): number | null {
	const left = toEpochMs(to) - now;
	if (left <= 0) return null;
	const remainder = left % 1000;
	return remainder === 0 ? 1000 : remainder;
}

/** Whether the digits turn destructive: at or below `urgentBelow` seconds. Never without one. */
export function isCountdownUrgent(seconds: number, urgentBelow: number | undefined): boolean {
	return urgentBelow !== undefined && seconds <= urgentBelow;
}
