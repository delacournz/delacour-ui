import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import type { CalendarDate, CalendarSelectionState } from "../calendar/calendar.date";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants } from "../input/input.variants";
import {
	DATE_PICKER_CLOSE_DELAY,
	DATE_PICKER_MODES,
	datePickerVariants,
	emptySelection,
	formatSelection,
	hasSelection,
	resolveAnnouncement,
	resolveCloseDelay,
	resolveDatePickerAxes,
	resolveDatePickerIconColor,
	resolveDatePickerMessages,
	resolveDatePickerTriggerClass,
	resolveDefaultPlaceholder,
	resolveIsClearable,
	resolveMessagePlaceholder,
	resolveSelectionAccessibilityValue,
	resolveShouldClose,
	resolveTriggerState,
} from "./date-picker.variants";

function d(year: number, month: number, day: number): CalendarDate {
	return { year, month, day };
}

const OCT_5 = d(2026, 10, 5);
const OCT_9 = d(2026, 10, 9);
const JAN_3_NEXT = d(2027, 1, 3);

function count(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe("resolveShouldClose", () => {
	test("single closes once a day is picked, not when it clears", () => {
		expect(resolveShouldClose({ mode: "single", value: null })).toBe(false);
		expect(resolveShouldClose({ mode: "single", value: OCT_5 })).toBe(true);
	});

	test("range closes only when both ends exist", () => {
		expect(resolveShouldClose({ mode: "range", value: { start: null, end: null } })).toBe(false);
		expect(resolveShouldClose({ mode: "range", value: { start: OCT_5, end: null } })).toBe(false);
		expect(resolveShouldClose({ mode: "range", value: { start: OCT_5, end: OCT_9 } })).toBe(true);
	});

	test("multiple never closes on its own", () => {
		expect(resolveShouldClose({ mode: "multiple", value: [] })).toBe(false);
		expect(resolveShouldClose({ mode: "multiple", value: [OCT_5, OCT_9] })).toBe(false);
	});
});

describe("resolveCloseDelay", () => {
	test("waits long enough for the pick to be seen, unless motion is calm", () => {
		expect(DATE_PICKER_CLOSE_DELAY).toBe(120);
		expect(resolveCloseDelay(false)).toBe(DATE_PICKER_CLOSE_DELAY);
		expect(resolveCloseDelay(true)).toBe(0);
	});
});

describe("formatSelection", () => {
	test("an empty selection formats to nothing, so the placeholder shows", () => {
		expect(formatSelection({ mode: "single", value: null })).toBeUndefined();
		expect(formatSelection({ mode: "range", value: { start: null, end: null } })).toBeUndefined();
		expect(formatSelection({ mode: "multiple", value: [] })).toBeUndefined();
	});

	test("a single day uses the medium style", () => {
		const text = formatSelection({ mode: "single", value: OCT_5 }, { locale: "en-NZ" });
		expect(text).toContain("Oct");
		expect(text).toContain("2026");
		expect(text).toContain("5");
	});

	test("a range within one month names the month once", () => {
		const text = formatSelection({ mode: "range", value: { start: OCT_5, end: OCT_9 } }, { locale: "en-NZ" }) ?? "";
		expect(count(text, "Oct")).toBe(1);
		expect(text).toContain("5");
		expect(text).toContain("9");
	});

	test("a range across years keeps both years", () => {
		const text =
			formatSelection({ mode: "range", value: { start: OCT_5, end: JAN_3_NEXT } }, { locale: "en-NZ" }) ?? "";
		expect(text).toContain("2026");
		expect(text).toContain("2027");
	});

	test("a half-picked range ends with an en dash and no end", () => {
		const text = formatSelection({ mode: "range", value: { start: OCT_5, end: null } }, { locale: "en-NZ" }) ?? "";
		expect(text.endsWith("–")).toBe(true);
		expect(text).toContain("Oct");
		expect(text).not.toContain("9");
	});

	test("multiple lists one or two days, then counts", () => {
		const one = formatSelection({ mode: "multiple", value: [OCT_5] }, { locale: "en-NZ" }) ?? "";
		expect(count(one, "Oct")).toBe(1);
		const two = formatSelection({ mode: "multiple", value: [OCT_5, OCT_9] }, { locale: "en-NZ" }) ?? "";
		expect(count(two, "Oct")).toBe(2);
		expect(two).toContain(", ");
		expect(formatSelection({ mode: "multiple", value: [OCT_5, OCT_9, JAN_3_NEXT] })).toBe("3 dates");
	});

	test("a custom format wins for single and multiple days", () => {
		const format = (value: CalendarDate, { locale }: { locale: string | undefined }) =>
			`${value.day}/${value.month} (${locale})`;
		expect(formatSelection({ mode: "single", value: OCT_5 }, { format, locale: "en-NZ" })).toBe("5/10 (en-NZ)");
		expect(formatSelection({ mode: "multiple", value: [OCT_5, OCT_9] }, { format, locale: "en-NZ" })).toBe(
			"5/10 (en-NZ), 9/10 (en-NZ)"
		);
	});

	test("a custom range format wins, and a day format composes a range without one", () => {
		const formatRange = () => "the stay";
		expect(formatSelection({ mode: "range", value: { start: OCT_5, end: OCT_9 } }, { formatRange })).toBe("the stay");
		const format = (value: CalendarDate) => `${value.day}/${value.month}`;
		expect(formatSelection({ mode: "range", value: { start: OCT_5, end: OCT_9 } }, { format })).toBe("5/10 – 9/10");
		expect(formatSelection({ mode: "range", value: { start: OCT_5, end: null } }, { format })).toBe("5/10 –");
	});

	test("an unreadable locale falls back rather than throwing", () => {
		const text = formatSelection({ mode: "single", value: OCT_5 }, { locale: "not a locale!!" });
		expect(typeof text).toBe("string");
		expect(text).toContain("2026");
	});
});

describe("resolveSelectionAccessibilityValue", () => {
	test("reads not set while empty", () => {
		expect(resolveSelectionAccessibilityValue({ mode: "single", value: null })).toBe("not set");
		expect(resolveSelectionAccessibilityValue({ mode: "multiple", value: [] })).toBe("not set");
	});

	test("reads full month names, and a range with 'to'", () => {
		expect(resolveSelectionAccessibilityValue({ mode: "single", value: OCT_5 }, "en-NZ")).toContain("October");
		const range = resolveSelectionAccessibilityValue({ mode: "range", value: { start: OCT_5, end: OCT_9 } }, "en-NZ");
		expect(range).toContain(" to ");
		expect(range).not.toContain("–");
	});

	test("a half range says which end is missing", () => {
		expect(resolveSelectionAccessibilityValue({ mode: "range", value: { start: OCT_5, end: null } }, "en-NZ")).toMatch(
			/^From .*October.*, no end chosen$/
		);
	});

	test("the announcement on close leads with Selected", () => {
		expect(resolveAnnouncement({ mode: "single", value: OCT_5 }, "en-NZ")).toMatch(/^Selected .*October 2026$/);
	});
});

describe("resolveDefaultPlaceholder", () => {
	test("one string per mode", () => {
		expect(resolveDefaultPlaceholder("single")).toBe("Select date");
		expect(resolveDefaultPlaceholder("range")).toBe("Start – End");
		expect(resolveDefaultPlaceholder("multiple")).toBe("Select dates");
		expect(new Set(DATE_PICKER_MODES.map(resolveDefaultPlaceholder)).size).toBe(3);
	});
});

describe("date picker messages", () => {
	test("keep English defaults and fill omitted partial messages", () => {
		const messages = resolveDatePickerMessages({ placeholderSingle: "Choose a day" });
		expect(messages.placeholderSingle).toBe("Choose a day");
		expect(messages.placeholderRange).toBe("Start – End");
		expect(messages.done).toBe("Done");
		expect(messages.calendar).toEqual({});
	});

	test("ignore undefined overrides but keep empty strings and formatter results", () => {
		const messages = resolveDatePickerMessages({
			title: undefined,
			placeholderSingle: undefined,
			selected: undefined,
		});
		expect(messages.title).toBe("Select date");
		expect(messages.placeholderSingle).toBe("Select date");
		expect(messages.selected("a date")).toBe("Selected a date");
		expect(resolveAnnouncement({ mode: "single", value: OCT_5 }, "en-NZ", messages)).toMatch(/^Selected /);
		const empty = resolveDatePickerMessages({ title: "", selected: () => "" });
		expect(empty.title).toBe("");
		expect(empty.selected("a date")).toBe("");
	});

	test("format all selection modes with caller supplied messages", () => {
		const messages = resolveDatePickerMessages({
			notSet: "فارغ",
			placeholderSingle: "اختر يومًا",
			placeholderRange: "من – إلى",
			placeholderMultiple: "اختر أيامًا",
			fromDateNoEnd: (date) => `من ${date}، لا يوجد تاريخ نهاية`,
			rangeValue: (start, end) => `من ${start} إلى ${end}`,
			multipleValues: (dates) => dates.join(" و"),
			multipleCount: (total) => `${total} تواريخ`,
			selected: (value) => `تم اختيار ${value}`,
		});
		expect(resolveMessagePlaceholder("single", messages)).toBe("اختر يومًا");
		expect(resolveMessagePlaceholder("range", messages)).toBe("من – إلى");
		expect(resolveMessagePlaceholder("multiple", messages)).toBe("اختر أيامًا");
		expect(formatSelection({ mode: "single", value: OCT_5 }, { format: () => "موعد", messages })).toBe("موعد");
		expect(
			formatSelection(
				{ mode: "range", value: { start: OCT_5, end: OCT_9 } },
				{ formatRange: () => "الإقامة", messages }
			)
		).toBe("الإقامة");
		expect(
			formatSelection({ mode: "multiple", value: [OCT_5, OCT_9] }, { format: (date) => `${date.day}`, messages })
		).toBe("5 و9");
		expect(resolveSelectionAccessibilityValue({ mode: "single", value: OCT_5 }, "not a locale!!", messages)).toContain(
			"October"
		);
		expect(
			resolveSelectionAccessibilityValue({ mode: "range", value: { start: OCT_5, end: null } }, "en-NZ", messages)
		).toMatch(/^من /);
		expect(
			resolveSelectionAccessibilityValue({ mode: "range", value: { start: OCT_5, end: OCT_9 } }, "en-NZ", messages)
		).toContain(" إلى ");
		expect(
			resolveSelectionAccessibilityValue({ mode: "multiple", value: [OCT_5, OCT_9] }, "en-NZ", messages)
		).toContain(" و");
		expect(
			resolveSelectionAccessibilityValue({ mode: "multiple", value: [OCT_5, OCT_9, JAN_3_NEXT] }, "en-NZ", messages)
		).toBe("3 تواريخ");
		expect(resolveSelectionAccessibilityValue({ mode: "multiple", value: [] }, "en-NZ", messages)).toBe("فارغ");
		expect(resolveAnnouncement({ mode: "single", value: OCT_5 }, "en-NZ", messages)).toMatch(/^تم اختيار /);
	});

	test("overrides the sheet title and action labels", () => {
		const messages = resolveDatePickerMessages({ title: "اختيار تاريخ", done: "تم" });
		expect(messages.title).toBe("اختيار تاريخ");
		expect(messages.done).toBe("تم");
	});
});

describe("emptySelection and hasSelection", () => {
	test("empty is the mode's own empty shape", () => {
		expect(emptySelection("single")).toEqual({ mode: "single", value: null });
		expect(emptySelection("range")).toEqual({ mode: "range", value: { start: null, end: null } });
		expect(emptySelection("multiple")).toEqual({ mode: "multiple", value: [] });
		for (const mode of DATE_PICKER_MODES) expect(hasSelection(emptySelection(mode))).toBe(false);
	});

	test("a started range counts as a selection", () => {
		const started: CalendarSelectionState = { mode: "range", value: { start: OCT_5, end: null } };
		expect(hasSelection(started)).toBe(true);
		expect(hasSelection({ mode: "multiple", value: [OCT_5] })).toBe(true);
		expect(hasSelection({ mode: "single", value: OCT_5 })).toBe(true);
	});
});

describe("resolveIsClearable", () => {
	test("defaults on for range and multiple, off for single; an explicit value wins", () => {
		expect(resolveIsClearable("single", undefined)).toBe(false);
		expect(resolveIsClearable("range", undefined)).toBe(true);
		expect(resolveIsClearable("multiple", undefined)).toBe(true);
		expect(resolveIsClearable("single", true)).toBe(true);
		expect(resolveIsClearable("range", false)).toBe(false);
	});
});

describe("resolveDatePickerAxes", () => {
	test("nearest wins: own, then field, then defaults; false is a value", () => {
		expect(resolveDatePickerAxes({})).toEqual({
			isDisabled: false,
			isInvalid: false,
			isReadOnly: false,
			size: "md",
			variant: "primary",
		});
		expect(resolveDatePickerAxes({ field: { isDisabled: true, isInvalid: true } })).toMatchObject({
			isDisabled: true,
			isInvalid: true,
		});
		expect(
			resolveDatePickerAxes({
				field: { isDisabled: true, isInvalid: true },
				own: { isDisabled: false, isInvalid: false },
			})
		).toMatchObject({ isDisabled: false, isInvalid: false });
	});
});

describe("resolveTriggerState", () => {
	test("open is focus, and disabled or read-only can never open", () => {
		expect(resolveTriggerState({ isDisabled: false, isInvalid: false, isOpen: true, isReadOnly: false })).toEqual({
			canOpen: true,
			isDisabled: false,
			isFocused: true,
			isInvalid: false,
		});
		expect(resolveTriggerState({ isDisabled: true, isInvalid: false, isOpen: true, isReadOnly: false })).toMatchObject({
			canOpen: false,
			isFocused: false,
		});
		expect(resolveTriggerState({ isDisabled: false, isInvalid: false, isOpen: false, isReadOnly: true }).canOpen).toBe(
			false
		);
	});

	test("invalid outranks focus on the border", () => {
		const state = resolveTriggerState({ isDisabled: false, isInvalid: true, isOpen: true, isReadOnly: false });
		const cls = resolveDatePickerTriggerClass({ ...state, size: "md", variant: "primary" });
		expect(cls).toContain("border-destructive");
		expect(cls).not.toContain("border-ring");
	});
});

describe("the trigger box", () => {
	test("is a superset of the Input box at every size, variant and state", () => {
		const states = INPUT_VARIANTS.flatMap((variant) =>
			INPUT_SIZES.flatMap((size) =>
				[0, 1, 2, 3, 4, 5, 6, 7].map((mask) => ({
					isDisabled: (mask & 1) !== 0,
					isFocused: (mask & 2) !== 0,
					isInvalid: (mask & 4) !== 0,
					size,
					variant,
				}))
			)
		);
		for (const state of states) {
			const trigger = new Set(resolveDatePickerTriggerClass(state).split(/\s+/));
			const missing = inputVariants(state)
				.root()
				.split(/\s+/)
				.filter((cls) => !trigger.has(cls));
			expect({ state, missing }).toEqual({ state, missing: [] });
		}
	});

	test("the value text sits on the input type scale", () => {
		for (const size of INPUT_SIZES) {
			expect(datePickerVariants({ size }).value()).toContain(`text-input-${size}`);
			expect(datePickerVariants({ size }).icon()).toContain(`size-icon-${size}`);
		}
	});

	test("a caller's className reaches the trigger", () => {
		expect(resolveDatePickerTriggerClass({ className: "mt-4" })).toContain("mt-4");
	});
});

describe("the icon colour", () => {
	test("muted at rest, destructive while invalid", () => {
		expect(resolveDatePickerIconColor(false)).toBe("muted-foreground");
		expect(resolveDatePickerIconColor(true)).toBe("destructive");
	});
});

/** Every class string a slot can produce. */
function everyClass(): string[] {
	const out: string[] = [];
	for (const size of INPUT_SIZES) {
		for (const isPlaceholder of [false, true]) {
			for (const isInvalid of [false, true]) {
				const slots = datePickerVariants({ isInvalid, isPlaceholder, size });
				for (const slot of Object.values(slots)) out.push(slot() ?? "");
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

describe("date picker colour tokens", () => {
	test("every token a slot names is declared in both themes", () => {
		const tokens = new Set([...everyClass().flatMap(colourTokens), resolveDatePickerIconColor(false)]);
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

	test("only the value slot carries a text colour", () => {
		for (const size of INPUT_SIZES) {
			const slots = datePickerVariants({ size, isPlaceholder: true, isInvalid: true });
			for (const slot of ["trigger", "header", "body", "footer"] as const) {
				expect(slots[slot]()).not.toMatch(/\btext-(?!input-)[a-z]/);
			}
		}
	});
});
