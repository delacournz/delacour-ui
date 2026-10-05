import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { TIME_PICKER_DEFAULT_VISIBLE_ROWS, TIME_PICKER_ROW_HEIGHTS } from "../time-picker/time-picker.variants";
import type { DateTimeValue } from "./date-time-picker.value";
import {
	DATE_TIME_PICKER_DEFAULTS,
	DATE_TIME_PICKER_EXPAND_DURATION,
	DATE_TIME_PICKER_LAYOUTS,
	DATE_TIME_PICKER_PRESENTATIONS,
	DATE_TIME_PICKER_SECTIONS,
	DATE_TIME_PICKER_WHEEL_HEIGHT,
	dateTimePickerVariants,
	resolveDateTimeAccessibilityValue,
	resolveDateTimeAnnouncement,
	resolveDateTimeDisplay,
	resolveExpandDuration,
	resolveShouldAutoAdvance,
	resolveTimeReadout,
} from "./date-time-picker.variants";

const VALUE: DateTimeValue = { date: { year: 2026, month: 10, day: 5 }, time: { hour: 15, minute: 30 } };

describe("axes", () => {
	test("layouts, presentations and sections are the documented sets", () => {
		expect(DATE_TIME_PICKER_LAYOUTS).toEqual(["tabs", "stacked"]);
		expect(DATE_TIME_PICKER_PRESENTATIONS).toEqual(["sheet", "inline"]);
		expect(DATE_TIME_PICKER_SECTIONS).toEqual(["date", "time"]);
	});

	test("defaults are the spec's words", () => {
		expect(DATE_TIME_PICKER_DEFAULTS).toEqual({
			accessibilityLabel: "Date and time",
			clearLabel: "Clear",
			dateLabel: "Date",
			doneLabel: "Done",
			placeholder: "Select date and time",
			timeLabel: "Time",
			title: "Select date and time",
		});
	});
});

describe("stacked expansion", () => {
	test("the constants are positive", () => {
		expect(DATE_TIME_PICKER_EXPAND_DURATION).toBeGreaterThan(0);
		expect(DATE_TIME_PICKER_WHEEL_HEIGHT).toBeGreaterThan(0);
	});

	test("the wheel height is the md wheel's own — rows times row height", () => {
		expect(DATE_TIME_PICKER_WHEEL_HEIGHT).toBe(TIME_PICKER_ROW_HEIGHTS.md * TIME_PICKER_DEFAULT_VISIBLE_ROWS);
	});

	test("calm motion makes the expansion instant", () => {
		expect(resolveExpandDuration(false)).toBe(DATE_TIME_PICKER_EXPAND_DURATION);
		expect(resolveExpandDuration(true)).toBe(0);
	});
});

describe("resolveShouldAutoAdvance", () => {
	test("tabs advance to Time after the first date pick of an empty value", () => {
		expect(resolveShouldAutoAdvance({ layout: "tabs", hadValue: false, hasAdvanced: false })).toBe(true);
	});

	test("only once per opening", () => {
		expect(resolveShouldAutoAdvance({ layout: "tabs", hadValue: false, hasAdvanced: true })).toBe(false);
	});

	test("never when a time already exists", () => {
		expect(resolveShouldAutoAdvance({ layout: "tabs", hadValue: true, hasAdvanced: false })).toBe(false);
	});

	test("never in the stacked layout, where both halves are on screen", () => {
		expect(resolveShouldAutoAdvance({ layout: "stacked", hadValue: false, hasAdvanced: false })).toBe(false);
	});
});

describe("resolveDateTimeDisplay", () => {
	test("nothing set is undefined — the placeholder's cue", () => {
		expect(resolveDateTimeDisplay(null, { locale: "en-US", hourCycle: 12 })).toBeUndefined();
	});

	test("formats through the leaf", () => {
		expect(resolveDateTimeDisplay(VALUE, { locale: "en-US", hourCycle: 12 })).toContain("3:30");
	});

	test("a custom format wins and hears the resolved locale and cycle", () => {
		const seen: unknown[] = [];
		const text = resolveDateTimeDisplay(VALUE, {
			format: (value, context) => {
				seen.push(context);
				return `${value.date.day}@${value.time.hour}`;
			},
			hourCycle: 24,
			locale: "en-GB",
		});
		expect(text).toBe("5@15");
		expect(seen).toEqual([{ hourCycle: 24, locale: "en-GB" }]);
	});
});

describe("resolveTimeReadout", () => {
	test("reads the time alone", () => {
		expect(resolveTimeReadout(VALUE, { locale: "en-GB", hourCycle: 24 })).toBe("15:30");
	});

	test("a dash while nothing is set", () => {
		expect(resolveTimeReadout(null, { locale: "en-GB", hourCycle: 24 })).toBe("–");
	});
});

describe("accessibility text", () => {
	test("the value reads in full, or 'not set'", () => {
		expect(resolveDateTimeAccessibilityValue(VALUE, { locale: "en-GB", hourCycle: 12 })).toMatch(
			/^Monday,? 5 October 2026 at 3:30\spm$/i
		);
		expect(resolveDateTimeAccessibilityValue(null, { locale: "en-GB", hourCycle: 12 })).toBe("not set");
	});

	test("Done announces the composed value", () => {
		expect(resolveDateTimeAnnouncement(VALUE, { locale: "en-GB", hourCycle: 24 })).toMatch(
			/^Selected Monday,? 5 October 2026 at 15:30$/
		);
		expect(resolveDateTimeAnnouncement(null, { locale: "en-GB", hourCycle: 24 })).toBe("No date and time selected");
	});
});

function everyClass(): string[] {
	const out: string[] = [];
	for (const layout of DATE_TIME_PICKER_LAYOUTS) {
		for (const isPlaceholder of [false, true]) {
			for (const isExpanded of [false, true]) {
				for (const isDisabled of [false, true]) {
					const slots = dateTimePickerVariants({ isDisabled, isExpanded, isPlaceholder, layout });
					for (const slot of Object.values(slots)) out.push(slot() ?? "");
				}
			}
		}
	}
	return out;
}

const NOT_COLOURS = new Set(["center", "left", "right", "xs", "sm", "md", "lg", "xl", "0", "transparent"]);
function colourTokens(value: string): string[] {
	const tokens: string[] = [];
	for (const [, token] of value.matchAll(/\b(?:bg|text|border)-([a-z][a-z-]*)(?:\/\d+)?\b/g)) {
		if (!token || NOT_COLOURS.has(token) || token.startsWith("input-")) continue;
		tokens.push(token);
	}
	return tokens;
}

describe("date-time picker colour tokens", () => {
	test("every token a slot names is declared in both themes", () => {
		const tokens = new Set(everyClass().flatMap(colourTokens));
		expect(tokens.size).toBeGreaterThan(1);
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

	test("only the text slots carry a text colour", () => {
		for (const layout of DATE_TIME_PICKER_LAYOUTS) {
			const slots = dateTimePickerVariants({ isDisabled: true, isExpanded: true, isPlaceholder: true, layout });
			for (const slot of ["content", "tabs", "panel", "divider", "timeRow", "timeWheel", "footer"] as const) {
				expect(slots[slot]()).not.toMatch(/\btext-(?!input-)[a-z]/);
			}
			for (const slot of ["timeLabel", "timeValue"] as const) {
				expect(slots[slot]()).toMatch(/\btext-(?!input-)[a-z]/);
			}
		}
	});

	test("a placeholder time reads muted, an expanded one in the primary tone", () => {
		expect(dateTimePickerVariants({ isPlaceholder: true }).timeValue()).toContain("text-muted-foreground");
		expect(dateTimePickerVariants({ isExpanded: true }).timeValue()).toContain("text-primary");
	});

	test("disabled fades the whole content", () => {
		expect(dateTimePickerVariants({ isDisabled: true }).content()).toContain("opacity-50");
		expect(dateTimePickerVariants({ isDisabled: false }).content()).not.toContain("opacity-50");
	});
});
