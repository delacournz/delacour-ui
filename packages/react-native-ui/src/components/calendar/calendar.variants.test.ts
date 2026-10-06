import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import type { CalendarDate, CalendarSelectionState } from "./calendar.date";
import {
	CALENDAR_DAY_TONES,
	CALENDAR_DEFAULT_SIZE,
	CALENDAR_DEFAULT_VARIANT,
	CALENDAR_RANGE_ROLES,
	CALENDAR_SIZES,
	CALENDAR_VARIANTS,
	type CalendarRangeRole,
	calendarVariants,
	isDateSelected,
	resolveCalendarAxes,
	resolveDayState,
	resolveDayTone,
	resolveMonthBounds,
	resolvePageDirection,
	resolveRangeRole,
} from "./calendar.variants";

function d(year: number, month: number, day: number): CalendarDate {
	return { year, month, day };
}

/** Every class string a slot can produce, across every axis this test cares about. */
function everyClass(): string[] {
	const out: string[] = [];
	for (const variant of CALENDAR_VARIANTS) {
		for (const size of CALENDAR_SIZES) {
			for (const tone of CALENDAR_DAY_TONES) {
				for (const rangeRole of CALENDAR_RANGE_ROLES) {
					for (const isInvalid of [false, true]) {
						for (const isToday of [false, true]) {
							for (const isOutside of [false, true]) {
								const slots = calendarVariants({ variant, size, tone, rangeRole, isInvalid, isToday, isOutside });
								for (const slot of Object.values(slots)) out.push(slot() ?? "");
							}
						}
					}
				}
			}
		}
	}
	return out;
}

/** Colour tokens named by `bg-*`, `text-*`, `border-*` — sizes and alignment are not colours. */
const NOT_COLOURS = new Set(["center", "left", "right", "xs", "sm", "md", "lg", "xl", "0", "2", "transparent"]);
function colourTokens(value: string): string[] {
	const tokens: string[] = [];
	for (const [, token] of value.matchAll(/\b(?:bg|text|border)-([a-z][a-z-]*)(?:\/\d+)?\b/g)) {
		if (!token || NOT_COLOURS.has(token) || token.startsWith("input-")) continue;
		tokens.push(token);
	}
	return tokens;
}

describe("calendar colour tokens", () => {
	test("every token a slot names is declared in both themes", () => {
		const tokens = new Set(everyClass().flatMap(colourTokens));
		expect(tokens.size).toBeGreaterThan(4);
		for (const token of tokens) {
			expect({ token, count: declarationCount(token) }).toEqual({ token, count: 2 });
		}
	});

	test("no slot uses a raw palette colour or a dark: prefix", () => {
		for (const value of everyClass()) {
			expect(value).not.toMatch(/\b(?:bg|text|border)-(?:zinc|gray|slate|neutral|black|white|red|blue)\b/);
			expect(value).not.toMatch(/\bdark:/);
		}
	});
});

describe("text colour stays on the text", () => {
	test("view slots never carry a text colour", () => {
		for (const variant of CALENDAR_VARIANTS) {
			for (const tone of CALENDAR_DAY_TONES) {
				for (const isInvalid of [false, true]) {
					const slots = calendarVariants({ variant, tone, isInvalid, isToday: true, isOutside: true });
					for (const slot of [
						"root",
						"header",
						"caption",
						"weekdays",
						"weekday",
						"grid",
						"week",
						"cell",
						"dayBase",
						"band",
						"pickerGrid",
						"pickerItem",
					] as const) {
						const value = slots[slot]();
						expect({ slot, value: /\btext-(?!input-)[a-z]/.test(value) }).toEqual({ slot, value: false });
					}
				}
			}
		}
	});

	test("label slots carry one", () => {
		const slots = calendarVariants({});
		for (const slot of ["dayLabel", "weekdayLabel", "captionText", "pickerItemLabel"] as const) {
			expect(colourTokens(slots[slot]()).length).toBeGreaterThan(0);
		}
	});
});

describe("range band rounding", () => {
	const roundingOf = (rangeRole: CalendarRangeRole) => calendarVariants({ rangeRole }).band();

	test("start rounds the left end only", () => {
		expect(roundingOf("start")).toContain("rounded-l-full");
		expect(roundingOf("start")).not.toMatch(/rounded-r-full|rounded-full/);
	});

	test("end rounds the right end only", () => {
		expect(roundingOf("end")).toContain("rounded-r-full");
		expect(roundingOf("end")).not.toMatch(/rounded-l-full|\brounded-full/);
	});

	test("only rounds both, and is never square", () => {
		expect(roundingOf("only")).toContain("rounded-full");
		expect(roundingOf("only")).not.toContain("rounded-none");
	});

	test("middle is square at both ends", () => {
		expect(roundingOf("middle")).toContain("rounded-none");
	});

	test("a selected day is a circle, never square", () => {
		for (const rangeRole of CALENDAR_RANGE_ROLES) {
			const value = calendarVariants({ tone: "selected", rangeRole }).dayBase();
			expect(value).toContain("rounded-full");
			expect(value).not.toContain("rounded-none");
		}
	});
});

describe("tones", () => {
	test("primary fills the selected day; secondary softens it", () => {
		expect(calendarVariants({ variant: "primary", tone: "selected" }).dayBase()).toContain("bg-primary");
		expect(calendarVariants({ variant: "primary", tone: "selected" }).dayLabel()).toContain("text-primary-foreground");
		expect(calendarVariants({ variant: "secondary", tone: "selected" }).dayBase()).toContain("bg-secondary");
	});

	test("invalid outranks the variant", () => {
		for (const variant of CALENDAR_VARIANTS) {
			expect(calendarVariants({ variant, tone: "selected", isInvalid: true }).dayBase()).toContain("bg-destructive");
			expect(calendarVariants({ variant, rangeRole: "middle", isInvalid: true }).band()).toContain(
				"bg-destructive-soft"
			);
		}
	});

	test("today is a ring, never a fill", () => {
		const today = calendarVariants({ tone: "plain", isToday: true }).dayBase();
		expect(today).toMatch(/\bborder\b/);
		expect(today).not.toMatch(/\bbg-(?!transparent)/);
	});

	test("an outside day is muted", () => {
		expect(calendarVariants({ tone: "plain", isOutside: true }).dayLabel()).toContain("text-muted-foreground");
	});
});

describe("sizes", () => {
	test("the cell steps on the input scale", () => {
		expect(calendarVariants({ size: "sm" }).cell()).toContain("h-input-sm");
		expect(calendarVariants({ size: "md" }).cell()).toContain("h-input-md");
		expect(calendarVariants({ size: "lg" }).cell()).toContain("h-input-lg");
		expect(calendarVariants({ size: "md" }).dayLabel()).toContain("text-input-md");
	});

	test("defaults are md and primary", () => {
		expect(CALENDAR_DEFAULT_SIZE).toBe("md");
		expect(CALENDAR_DEFAULT_VARIANT).toBe("primary");
		expect(calendarVariants({}).cell()).toBe(calendarVariants({ size: "md" }).cell());
	});
});

describe("resolveRangeRole", () => {
	const range = { start: d(2026, 10, 5), end: d(2026, 10, 9) };

	test("names each end and the days between", () => {
		expect(resolveRangeRole(range, d(2026, 10, 5))).toBe("start");
		expect(resolveRangeRole(range, d(2026, 10, 7))).toBe("middle");
		expect(resolveRangeRole(range, d(2026, 10, 9))).toBe("end");
		expect(resolveRangeRole(range, d(2026, 10, 10))).toBeNull();
	});

	test("a started range and a one-day range are only", () => {
		expect(resolveRangeRole({ start: d(2026, 10, 5), end: null }, d(2026, 10, 5))).toBe("only");
		expect(resolveRangeRole({ start: d(2026, 10, 5), end: null }, d(2026, 10, 6))).toBeNull();
		expect(resolveRangeRole({ start: d(2026, 10, 5), end: d(2026, 10, 5) }, d(2026, 10, 5))).toBe("only");
	});

	test("an empty range has no roles", () => {
		expect(resolveRangeRole({ start: null, end: null }, d(2026, 10, 5))).toBeNull();
	});
});

describe("resolveDayTone", () => {
	test("middle is the band, an end or a selection is filled", () => {
		expect(resolveDayTone({ isSelected: true, rangeRole: "middle" })).toBe("band");
		expect(resolveDayTone({ isSelected: true, rangeRole: "start" })).toBe("selected");
		expect(resolveDayTone({ isSelected: true, rangeRole: null })).toBe("selected");
		expect(resolveDayTone({ isSelected: false, rangeRole: null })).toBe("plain");
	});
});

describe("isDateSelected", () => {
	test("reads every mode", () => {
		const single: CalendarSelectionState = { mode: "single", value: d(2026, 10, 5) };
		expect(isDateSelected(single, d(2026, 10, 5))).toBe(true);
		expect(isDateSelected(single, d(2026, 10, 6))).toBe(false);
		const multiple: CalendarSelectionState = { mode: "multiple", value: [d(2026, 10, 1), d(2026, 10, 5)] };
		expect(isDateSelected(multiple, d(2026, 10, 5))).toBe(true);
		const range: CalendarSelectionState = { mode: "range", value: { start: d(2026, 10, 1), end: d(2026, 10, 5) } };
		expect(isDateSelected(range, d(2026, 10, 3))).toBe(true);
		expect(isDateSelected(range, d(2026, 10, 6))).toBe(false);
	});
});

describe("resolveDayState", () => {
	const base = {
		selection: { mode: "single", value: d(2026, 10, 5) } as CalendarSelectionState,
		today: d(2026, 10, 7),
		isDisabled: () => false,
		showOutsideDays: true,
		selectOutsideDays: false,
		isCalendarDisabled: false,
		isReadOnly: false,
	};

	test("a selected inside day is filled and pressable", () => {
		const state = resolveDayState({
			...base,
			cell: { date: d(2026, 10, 5), isOutside: false, weekIndex: 0, dayIndex: 0 },
		});
		expect(state).toMatchObject({ isSelected: true, tone: "selected", isPressable: true, isHidden: false });
	});

	test("today is marked", () => {
		const state = resolveDayState({
			...base,
			cell: { date: d(2026, 10, 7), isOutside: false, weekIndex: 0, dayIndex: 0 },
		});
		expect(state.isToday).toBe(true);
	});

	test("an outside day shows no selection and takes no tap unless asked", () => {
		const cell = { date: d(2026, 10, 5), isOutside: true, weekIndex: 0, dayIndex: 0 };
		expect(resolveDayState({ ...base, cell })).toMatchObject({ tone: "plain", isPressable: false });
		expect(resolveDayState({ ...base, cell, selectOutsideDays: true })).toMatchObject({
			tone: "selected",
			isPressable: true,
		});
		expect(resolveDayState({ ...base, cell, showOutsideDays: false }).isHidden).toBe(true);
	});

	test("a disabled day is dimmed and inert; a read-only calendar is inert but not dimmed", () => {
		const cell = { date: d(2026, 10, 9), isOutside: false, weekIndex: 0, dayIndex: 0 };
		expect(resolveDayState({ ...base, cell, isDisabled: () => true })).toMatchObject({
			isDisabled: true,
			isPressable: false,
		});
		expect(resolveDayState({ ...base, cell, isReadOnly: true })).toMatchObject({
			isDisabled: false,
			isPressable: false,
		});
		expect(resolveDayState({ ...base, cell, isCalendarDisabled: true }).isPressable).toBe(false);
	});
});

describe("resolveMonthBounds", () => {
	test("prefers the start and end months, then the min and max dates", () => {
		expect(resolveMonthBounds({ startMonth: d(2026, 1, 9), minDate: d(2026, 5, 1) }).first).toEqual(d(2026, 1, 1));
		expect(resolveMonthBounds({ minDate: d(2026, 5, 20) }).first).toEqual(d(2026, 5, 1));
		expect(resolveMonthBounds({ maxDate: d(2026, 12, 20) }).last).toEqual(d(2026, 12, 1));
		expect(resolveMonthBounds({})).toEqual({ first: null, last: null });
	});
});

describe("resolveCalendarAxes", () => {
	test("own props win, then the field, then the defaults", () => {
		expect(resolveCalendarAxes({ own: {}, field: null })).toEqual({
			variant: "primary",
			size: "md",
			isDisabled: false,
			isInvalid: false,
			isReadOnly: false,
		});
		expect(resolveCalendarAxes({ own: {}, field: { isDisabled: true, isInvalid: true } })).toMatchObject({
			isDisabled: true,
			isInvalid: true,
		});
		expect(resolveCalendarAxes({ own: { isDisabled: false }, field: { isDisabled: true } }).isDisabled).toBe(false);
	});
});

describe("resolvePageDirection", () => {
	const base = { width: 320, canGoPrev: true, canGoNext: true };

	test("a swipe left past the threshold pages forward, right pages back", () => {
		expect(resolvePageDirection({ ...base, translationX: -120, velocityX: 0 })).toBe(1);
		expect(resolvePageDirection({ ...base, translationX: 120, velocityX: 0 })).toBe(-1);
	});

	test("a short slow swipe settles back", () => {
		expect(resolvePageDirection({ ...base, translationX: -40, velocityX: -100 })).toBe(0);
	});

	test("a short fast flick pages", () => {
		expect(resolvePageDirection({ ...base, translationX: -40, velocityX: -900 })).toBe(1);
	});

	test("a flick against the drag settles back", () => {
		expect(resolvePageDirection({ ...base, translationX: -120, velocityX: 900 })).toBe(0);
	});

	test("never pages past a bound", () => {
		expect(resolvePageDirection({ ...base, canGoNext: false, translationX: -200, velocityX: -900 })).toBe(0);
		expect(resolvePageDirection({ ...base, canGoPrev: false, translationX: 200, velocityX: 900 })).toBe(0);
	});

	test("an unmeasured grid never pages", () => {
		expect(resolvePageDirection({ ...base, width: 0, translationX: -200, velocityX: 0 })).toBe(0);
	});
});
