import { describe, expect, test } from "bun:test";
import {
	COUNTDOWN_DEFAULT_LABELS,
	COUNTDOWN_DIGIT_TEXT_VARIANT,
	COUNTDOWN_SIZES,
	COUNTDOWN_UNITS,
	type CountdownParts,
	type CountdownUnit,
	countdownDigits,
	countdownVariants,
	formatCountdownInline,
	isCountdownUrgent,
	msUntilNextTick,
	resolveCountdownAccessibilityLabel,
	resolveCountdownUnits,
	secondsUntil,
	splitCountdown,
	toEpochMs,
	trimCountdownUnits,
} from "./countdown.variants";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ALL: readonly CountdownUnit[] = COUNTDOWN_UNITS;

function parts(days: number, hours: number, minutes: number, seconds: number): CountdownParts {
	return { days, hours, minutes, seconds };
}

describe("toEpochMs", () => {
	test("reads a Date and a number alike", () => {
		expect(toEpochMs(new Date(5000))).toBe(5000);
		expect(toEpochMs(5000)).toBe(5000);
	});

	test("an invalid date or a non-finite number reads as the epoch, so it is already up", () => {
		expect(toEpochMs(new Date(Number.NaN))).toBe(0);
		expect(toEpochMs(Number.NaN)).toBe(0);
		expect(toEpochMs(Number.POSITIVE_INFINITY)).toBe(0);
	});
});

describe("secondsUntil", () => {
	test("rounds up, so the final second reads 1 rather than 0", () => {
		expect(secondsUntil(10_000, 9_001)).toBe(1);
		expect(secondsUntil(10_000, 9_999)).toBe(1);
		expect(secondsUntil(10_000, 9_000)).toBe(1);
		expect(secondsUntil(10_000, 8_999)).toBe(2);
	});

	test("is zero exactly at the target, and past it", () => {
		expect(secondsUntil(10_000, 10_000)).toBe(0);
		expect(secondsUntil(10_000, 50_000)).toBe(0);
	});

	test("takes a Date", () => {
		expect(secondsUntil(new Date(61_000), 0)).toBe(61);
	});
});

describe("resolveCountdownUnits", () => {
	test("defaults to all four, largest first", () => {
		expect(resolveCountdownUnits(undefined)).toEqual(["days", "hours", "minutes", "seconds"]);
		expect(resolveCountdownUnits([])).toEqual(["days", "hours", "minutes", "seconds"]);
	});

	test("orders largest first and drops duplicates, however they are listed", () => {
		expect(resolveCountdownUnits(["seconds", "hours", "seconds", "minutes"])).toEqual(["hours", "minutes", "seconds"]);
	});
});

describe("splitCountdown", () => {
	test("splits into every unit", () => {
		expect(splitCountdown(2 * DAY + 14 * HOUR + 3 * MINUTE + 22, ALL)).toEqual(parts(2, 14, 3, 22));
	});

	test("boundaries: 0, 1 s, 59 s, 60 s, exactly one day", () => {
		expect(splitCountdown(0, ALL)).toEqual(parts(0, 0, 0, 0));
		expect(splitCountdown(1, ALL)).toEqual(parts(0, 0, 0, 1));
		expect(splitCountdown(59, ALL)).toEqual(parts(0, 0, 0, 59));
		expect(splitCountdown(60, ALL)).toEqual(parts(0, 0, 1, 0));
		expect(splitCountdown(DAY, ALL)).toEqual(parts(1, 0, 0, 0));
	});

	test("the largest selected unit absorbs everything above it", () => {
		expect(splitCountdown(2 * DAY, ["hours", "minutes"])).toEqual(parts(0, 48, 0, 0));
		expect(splitCountdown(2 * DAY + 90, ["minutes", "seconds"])).toEqual(parts(0, 0, 2881, 30));
	});

	test("the smallest selected unit rounds up, so a running countdown never reads zero", () => {
		expect(splitCountdown(1, ["hours", "minutes"])).toEqual(parts(0, 0, 1, 0));
		expect(splitCountdown(61, ["hours", "minutes"])).toEqual(parts(0, 0, 2, 0));
		expect(splitCountdown(60, ["hours", "minutes"])).toEqual(parts(0, 0, 1, 0));
		expect(splitCountdown(0, ["hours", "minutes"])).toEqual(parts(0, 0, 0, 0));
		expect(splitCountdown(DAY + 1, ["days"])).toEqual(parts(2, 0, 0, 0));
	});

	test("a negative or fractional count reads as its clamped whole seconds", () => {
		expect(splitCountdown(-5, ALL)).toEqual(parts(0, 0, 0, 0));
		expect(splitCountdown(1.2, ALL)).toEqual(parts(0, 0, 0, 2));
	});
});

describe("trimCountdownUnits", () => {
	test("drops leading zero units", () => {
		expect(trimCountdownUnits(parts(0, 14, 3, 22), ALL, true)).toEqual(["hours", "minutes", "seconds"]);
		expect(trimCountdownUnits(parts(0, 0, 3, 22), ALL, true)).toEqual(["minutes", "seconds"]);
	});

	test("never below the smallest two selected units", () => {
		expect(trimCountdownUnits(parts(0, 0, 0, 1), ALL, true)).toEqual(["minutes", "seconds"]);
		expect(trimCountdownUnits(parts(0, 0, 0, 0), ALL, true)).toEqual(["minutes", "seconds"]);
		expect(trimCountdownUnits(parts(0, 0, 0, 0), ["hours", "minutes"], true)).toEqual(["hours", "minutes"]);
	});

	test("one selected unit stays", () => {
		expect(trimCountdownUnits(parts(0, 0, 0, 5), ["seconds"], true)).toEqual(["seconds"]);
	});

	test("keeps a zero in the middle", () => {
		expect(trimCountdownUnits(parts(2, 0, 3, 22), ALL, true)).toEqual(ALL);
	});

	test("without trim, every selected unit shows", () => {
		expect(trimCountdownUnits(parts(0, 0, 0, 1), ALL, false)).toEqual(ALL);
	});
});

describe("formatCountdownInline", () => {
	test("days lead with a suffix, the rest are colon-joined", () => {
		expect(formatCountdownInline(parts(2, 14, 3, 22), ALL)).toBe("2d 14:03:22");
		expect(formatCountdownInline(parts(2, 4, 3, 2), ALL)).toBe("2d 04:03:02");
	});

	test("hours or minutes as the largest unit are not padded", () => {
		expect(formatCountdownInline(parts(0, 14, 3, 22), ["hours", "minutes", "seconds"])).toBe("14:03:22");
		expect(formatCountdownInline(parts(0, 4, 3, 22), ["hours", "minutes", "seconds"])).toBe("4:03:22");
		expect(formatCountdownInline(parts(0, 0, 3, 22), ["minutes", "seconds"])).toBe("3:22");
	});

	test("the final second and zero", () => {
		expect(formatCountdownInline(parts(0, 0, 0, 1), ["minutes", "seconds"])).toBe("0:01");
		expect(formatCountdownInline(parts(0, 0, 0, 0), ["minutes", "seconds"])).toBe("0:00");
	});

	test("an absorbing first unit keeps every digit", () => {
		expect(formatCountdownInline(parts(0, 48, 0, 0), ["hours", "minutes"])).toBe("48:00");
	});

	test("days alone", () => {
		expect(formatCountdownInline(parts(3, 0, 0, 0), ["days"])).toBe("3d");
	});
});

describe("countdownDigits", () => {
	test("pads every segment to two digits", () => {
		expect(countdownDigits(3)).toEqual(["0", "3"]);
		expect(countdownDigits(14)).toEqual(["1", "4"]);
	});

	test("keeps every digit of an absorbing unit", () => {
		expect(countdownDigits(2881)).toEqual(["2", "8", "8", "1"]);
	});
});

describe("resolveCountdownAccessibilityLabel", () => {
	test("above one minute: days, hours and minutes, never seconds", () => {
		expect(resolveCountdownAccessibilityLabel(2 * DAY + 14 * HOUR + 3 * MINUTE + 22, ALL)).toBe(
			"2 days, 14 hours, 3 minutes left"
		);
	});

	test("zero units are left out, and one is singular", () => {
		expect(resolveCountdownAccessibilityLabel(DAY + 1 * MINUTE + 5, ALL)).toBe("1 day, 1 minute left");
		expect(resolveCountdownAccessibilityLabel(DAY, ALL)).toBe("1 day left");
	});

	test("exactly a minute says minutes; the final minute says seconds", () => {
		expect(resolveCountdownAccessibilityLabel(60, ALL)).toBe("1 minute left");
		expect(resolveCountdownAccessibilityLabel(61, ALL)).toBe("1 minute left");
		expect(resolveCountdownAccessibilityLabel(59, ALL)).toBe("59 seconds left");
		expect(resolveCountdownAccessibilityLabel(1, ALL)).toBe("1 second left");
	});

	test("does not change within a minute while above one minute", () => {
		const labels = new Set<string>();
		for (let s = 2 * MINUTE; s < 3 * MINUTE; s++) labels.add(resolveCountdownAccessibilityLabel(s, ALL));
		expect(labels.size).toBe(1);
	});

	test("follows absorption", () => {
		expect(resolveCountdownAccessibilityLabel(2 * DAY, ["hours", "minutes"])).toBe("48 hours left");
	});

	test("without seconds selected, the final minute rounds up to one minute", () => {
		expect(resolveCountdownAccessibilityLabel(30, ["hours", "minutes"])).toBe("1 minute left");
	});

	test("zero is time up", () => {
		expect(resolveCountdownAccessibilityLabel(0, ALL)).toBe("Time is up");
	});

	test("caller labels name the units", () => {
		expect(resolveCountdownAccessibilityLabel(2 * DAY + HOUR, ALL, { days: "Tage", hours: "Stunden" })).toBe(
			"2 Tage, 1 Stunden left"
		);
	});
});

describe("msUntilNextTick", () => {
	test("waits for the next whole-second boundary of the time left", () => {
		expect(msUntilNextTick(10_000, 8_700)).toBe(300);
		expect(msUntilNextTick(10_000, 9_999)).toBe(1);
	});

	test("on a boundary, waits a whole second", () => {
		expect(msUntilNextTick(10_000, 8_000)).toBe(1000);
	});

	test("the tick lands where secondsUntil changes", () => {
		const to = 10_000;
		const now = 3_456;
		const delay = msUntilNextTick(to, now);
		expect(delay).not.toBeNull();
		const at = now + (delay ?? 0);
		expect(secondsUntil(to, at)).toBe(secondsUntil(to, now) - 1);
		expect(secondsUntil(to, at - 1)).toBe(secondsUntil(to, now));
	});

	test("null once time is up", () => {
		expect(msUntilNextTick(10_000, 10_000)).toBeNull();
		expect(msUntilNextTick(10_000, 11_000)).toBeNull();
	});
});

describe("isCountdownUrgent", () => {
	test("at or below the threshold", () => {
		expect(isCountdownUrgent(60, 60)).toBe(true);
		expect(isCountdownUrgent(0, 60)).toBe(true);
		expect(isCountdownUrgent(61, 60)).toBe(false);
	});

	test("never without a threshold", () => {
		expect(isCountdownUrgent(0, undefined)).toBe(false);
	});
});

describe("countdownVariants", () => {
	test("a segment is a muted, rounded box", () => {
		const segment = countdownVariants({ variant: "segmented" }).segment();
		expect(segment).toContain("bg-muted");
		expect(segment).toContain("rounded-md");
	});

	test("digits are tabular in both variants", () => {
		expect(countdownVariants({ variant: "segmented" }).value()).toContain("tabular-nums");
		expect(countdownVariants({ variant: "inline" }).value()).toContain("tabular-nums");
	});

	test("a digit column clips its slide", () => {
		expect(countdownVariants().digit()).toContain("overflow-hidden");
	});

	test("size steps the box padding", () => {
		const padding = COUNTDOWN_SIZES.map((size) => countdownVariants({ size, variant: "segmented" }).segment());
		expect(new Set(padding).size).toBe(COUNTDOWN_SIZES.length);
	});

	test("urgent paints the digits destructive", () => {
		expect(countdownVariants({ isUrgent: true }).value()).toContain("text-destructive");
		expect(countdownVariants({ isUrgent: false }).value()).not.toContain("text-destructive");
	});

	test("size steps the digit preset up the type scale", () => {
		expect(COUNTDOWN_DIGIT_TEXT_VARIANT).toEqual({ lg: "display", md: "title", sm: "header" });
	});

	test("every unit has a default caption", () => {
		for (const unit of COUNTDOWN_UNITS) expect(COUNTDOWN_DEFAULT_LABELS[unit].length).toBeGreaterThan(0);
	});
});
