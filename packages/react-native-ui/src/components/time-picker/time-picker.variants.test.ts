import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants } from "../input/input.variants";
import {
	indexToOffset,
	nearestEnabledIndex,
	offsetToIndex,
	resolveColumnAccessibilityValue,
	resolveTimeFromColumn,
	resolveTimePickerTriggerClass,
	resolveTimeWheelColumns,
	resolveWheelPadding,
	resolveWheelRowAppearance,
	TIME_PICKER_DEFAULT_VISIBLE_ROWS,
	TIME_PICKER_ROW_HEIGHTS,
	TIME_PICKER_VISIBLE_ROWS,
	type TimeWheelColumnKind,
	type TimeWheelColumnModel,
	timePickerVariants,
} from "./time-picker.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Size and type-scale suffixes that share `text-*` with colours but name none. */
const NON_COLOR_TEXT = /^(input-|xs$|sm$|base$|lg$|xl$|center$|left$|right$)/;

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		if (utility === "text" && NON_COLOR_TEXT.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

const SLOT_NAMES = [
	"trigger",
	"value",
	"icon",
	"wheel",
	"column",
	"row",
	"rowText",
	"selectionBand",
	"separator",
	"header",
	"footer",
] as const;

/** Slots a `View` wears — rule 1 keeps text colour off them. */
const VIEW_SLOTS = ["trigger", "wheel", "column", "row", "selectionBand", "header", "footer"] as const;

const column = (columns: TimeWheelColumnModel[], kind: TimeWheelColumnKind): TimeWheelColumnModel => {
	const found = columns.find((entry) => entry.kind === kind);
	if (!found) throw new Error(`no ${kind} column`);
	return found;
};

describe("tokens", () => {
	test("every colour a slot paints exists in both themes", () => {
		for (const size of INPUT_SIZES) {
			for (const isSelected of [true, false]) {
				for (const isRowDisabled of [true, false]) {
					for (const isPlaceholder of [true, false]) {
						const slots = timePickerVariants({ size, isSelected, isRowDisabled, isPlaceholder });
						for (const name of SLOT_NAMES) {
							for (const token of colorTokens(slots[name]())) {
								expect(LIGHT.has(token)).toBe(true);
								expect(DARK.has(token)).toBe(true);
							}
						}
					}
				}
			}
		}
	});
});

describe("rule 1: colour on the text, never the view", () => {
	test("view slots carry no text colour", () => {
		const slots = timePickerVariants({ isPlaceholder: true, isRowDisabled: true, isSelected: true });
		for (const name of VIEW_SLOTS) {
			expect(slots[name]()).not.toMatch(/\btext-(?!input-)[a-z]/);
		}
	});

	test("text slots do carry colour", () => {
		const slots = timePickerVariants();
		expect(slots.value()).toMatch(/\btext-foreground\b/);
		expect(slots.rowText()).toMatch(/\btext-foreground\b/);
		expect(slots.separator()).toMatch(/\btext-foreground\b/);
	});

	test("a placeholder and a disabled row are muted", () => {
		expect(timePickerVariants({ isPlaceholder: true }).value()).toMatch(/\btext-muted-foreground\b/);
		expect(timePickerVariants({ isRowDisabled: true }).rowText()).toMatch(/\btext-muted-foreground\b/);
	});
});

describe("the trigger is Input's box", () => {
	test("same height, border and corner as a lone Input, for every state", () => {
		for (const variant of INPUT_VARIANTS) {
			for (const size of INPUT_SIZES) {
				for (const isInvalid of [true, false]) {
					for (const isFocused of [true, false]) {
						for (const isDisabled of [true, false]) {
							const box = inputVariants({ variant, size, isInvalid, isFocused, isDisabled }).root();
							const trigger = resolveTimePickerTriggerClass({
								variant,
								size,
								isInvalid,
								isFocused,
								isDisabled,
							});
							for (const cls of box.split(" ")) expect(trigger.split(" ")).toContain(cls);
						}
					}
				}
			}
		}
	});

	test("the height token is h-input-*", () => {
		for (const size of INPUT_SIZES) {
			expect(resolveTimePickerTriggerClass({ size })).toContain(`h-input-${size}`);
		}
	});

	test("the value's type scale is the field's", () => {
		for (const size of INPUT_SIZES) {
			expect(timePickerVariants({ size }).value()).toContain(`text-input-${size}`);
		}
	});

	test("a caller's class wins", () => {
		expect(resolveTimePickerTriggerClass({ className: "h-20" })).toContain("h-20");
		expect(resolveTimePickerTriggerClass({ className: "h-20" })).not.toContain("h-input-md");
	});
});

describe("wheel geometry", () => {
	test("row heights ascend with size", () => {
		expect(TIME_PICKER_ROW_HEIGHTS).toEqual({ sm: 32, md: 40, lg: 48 });
	});

	test("visible rows are odd and the default is one of them", () => {
		for (const rows of TIME_PICKER_VISIBLE_ROWS) expect(rows % 2).toBe(1);
		expect(TIME_PICKER_VISIBLE_ROWS).toContain(TIME_PICKER_DEFAULT_VISIBLE_ROWS);
	});

	test("padding centres the first and last row", () => {
		expect(resolveWheelPadding(40, 5)).toBe(80);
		expect(resolveWheelPadding(32, 3)).toBe(32);
	});

	test("offsetToIndex / indexToOffset round trip", () => {
		for (let index = 0; index < 60; index++) {
			expect(offsetToIndex(indexToOffset(index, 40), 40, 60)).toBe(index);
		}
	});

	test("offsetToIndex rounds to the nearest row", () => {
		expect(offsetToIndex(59, 40, 10)).toBe(1);
		expect(offsetToIndex(61, 40, 10)).toBe(2);
	});

	test("offsetToIndex clamps at both ends", () => {
		expect(offsetToIndex(-200, 40, 10)).toBe(0);
		expect(offsetToIndex(10_000, 40, 10)).toBe(9);
		expect(offsetToIndex(100, 0, 10)).toBe(0);
	});
});

describe("nearestEnabledIndex", () => {
	test("an enabled index is itself", () => {
		expect(nearestEnabledIndex(2, [false, false, false])).toBe(2);
	});

	test("finds the closest enabled row", () => {
		expect(nearestEnabledIndex(0, [true, true, false, false])).toBe(2);
		expect(nearestEnabledIndex(3, [false, true, true, true])).toBe(0);
	});

	test("ties go forward", () => {
		expect(nearestEnabledIndex(1, [false, true, false])).toBe(2);
	});

	test("all disabled is -1", () => {
		expect(nearestEnabledIndex(1, [true, true])).toBe(-1);
	});
});

describe("resolveWheelRowAppearance", () => {
	test("the centred row is whole", () => {
		expect(resolveWheelRowAppearance(0, false)).toEqual({ opacity: 1, scale: 1 });
	});

	test("rows fade and shrink with distance, never below a floor", () => {
		const one = resolveWheelRowAppearance(1, false);
		const three = resolveWheelRowAppearance(3, false);
		expect(one.opacity).toBeLessThan(1);
		expect(three.opacity).toBeLessThan(one.opacity);
		expect(three.opacity).toBeGreaterThan(0);
		expect(three.scale).toBeLessThan(one.scale);
		expect(resolveWheelRowAppearance(20, false).scale).toBeGreaterThan(0.5);
	});

	test("direction does not matter", () => {
		expect(resolveWheelRowAppearance(-1.5, false)).toEqual(resolveWheelRowAppearance(1.5, false));
	});

	test("calm motion keeps scale at 1 and steps the opacity", () => {
		expect(resolveWheelRowAppearance(1.4, true).scale).toBe(1);
		expect(resolveWheelRowAppearance(1.4, true).opacity).toBe(resolveWheelRowAppearance(1, true).opacity);
	});
});

describe("resolveTimeWheelColumns", () => {
	const base = { minuteStep: 1, showSeconds: false, bounds: {}, periodLabels: { am: "AM", pm: "PM" } };

	test("24-hour: hour and minute only", () => {
		const columns = resolveTimeWheelColumns({ ...base, time: { hour: 15, minute: 5 }, hourCycle: 24 });
		expect(columns.map((entry) => entry.kind)).toEqual(["hour", "minute"]);
		const hours = column(columns, "hour");
		expect(hours.rows).toHaveLength(24);
		expect(hours.rows[0].label).toBe("00");
		expect(hours.rows[hours.selectedIndex].value).toBe(15);
	});

	test("12-hour: 12 first, then 1–11, plus a two-row period", () => {
		const columns = resolveTimeWheelColumns({ ...base, time: { hour: 15, minute: 5 }, hourCycle: 12 });
		expect(columns.map((entry) => entry.kind)).toEqual(["hour", "minute", "period"]);
		const hours = column(columns, "hour");
		expect(hours.rows.map((row) => row.label)).toEqual(["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
		expect(hours.rows[hours.selectedIndex].label).toBe("3");
		expect(hours.rows[0].value).toBe(12);
		const period = column(columns, "period");
		expect(period.rows.map((row) => row.label)).toEqual(["AM", "PM"]);
		expect(period.selectedIndex).toBe(1);
	});

	test("12 AM selects the 12 row in the AM period", () => {
		const columns = resolveTimeWheelColumns({ ...base, time: { hour: 0, minute: 0 }, hourCycle: 12 });
		expect(column(columns, "hour").selectedIndex).toBe(0);
		expect(column(columns, "hour").rows[0].value).toBe(0);
		expect(column(columns, "period").selectedIndex).toBe(0);
	});

	test("minute rows follow the step, padded", () => {
		const columns = resolveTimeWheelColumns({ ...base, minuteStep: 15, time: { hour: 9, minute: 30 }, hourCycle: 24 });
		const minutes = column(columns, "minute");
		expect(minutes.rows.map((row) => row.label)).toEqual(["00", "15", "30", "45"]);
		expect(minutes.selectedIndex).toBe(2);
	});

	test("an off-step minute selects the nearest row", () => {
		const columns = resolveTimeWheelColumns({ ...base, minuteStep: 15, time: { hour: 9, minute: 22 }, hourCycle: 24 });
		expect(column(columns, "minute").selectedIndex).toBe(1);
	});

	test("seconds add a third wheel", () => {
		const columns = resolveTimeWheelColumns({
			...base,
			showSeconds: true,
			time: { hour: 9, minute: 0, second: 42 },
			hourCycle: 24,
		});
		expect(columns.map((entry) => entry.kind)).toEqual(["hour", "minute", "second"]);
		expect(column(columns, "second").selectedIndex).toBe(42);
	});

	test("rows outside the bounds are disabled", () => {
		const columns = resolveTimeWheelColumns({
			...base,
			minuteStep: 5,
			bounds: { minTime: { hour: 9, minute: 20 }, maxTime: { hour: 17, minute: 0 } },
			time: { hour: 9, minute: 30 },
			hourCycle: 24,
		});
		const hours = column(columns, "hour");
		expect(hours.rows[8].isDisabled).toBe(true);
		expect(hours.rows[9].isDisabled).toBe(false);
		expect(hours.rows[18].isDisabled).toBe(true);
		const minutes = column(columns, "minute");
		expect(minutes.rows.find((row) => row.value === 15)?.isDisabled).toBe(true);
		expect(minutes.rows.find((row) => row.value === 20)?.isDisabled).toBe(false);
	});

	test("a period with no enabled hour is disabled", () => {
		const columns = resolveTimeWheelColumns({
			...base,
			bounds: { minTime: { hour: 13, minute: 0 } },
			time: { hour: 14, minute: 0 },
			hourCycle: 12,
		});
		expect(column(columns, "period").rows[0].isDisabled).toBe(true);
		expect(column(columns, "period").rows[1].isDisabled).toBe(false);
	});
});

describe("resolveTimeFromColumn", () => {
	const time = { hour: 15, minute: 5 };

	test("hour rows carry the stored hour", () => {
		expect(resolveTimeFromColumn(time, "hour", 9)).toEqual({ hour: 9, minute: 5 });
	});

	test("minute and second replace their field", () => {
		expect(resolveTimeFromColumn(time, "minute", 45)).toEqual({ hour: 15, minute: 45 });
		expect(resolveTimeFromColumn({ ...time, second: 3 }, "second", 30)).toEqual({ hour: 15, minute: 5, second: 30 });
	});

	test("the period flips the hour through to24Hour", () => {
		expect(resolveTimeFromColumn(time, "period", 0)).toEqual({ hour: 3, minute: 5 });
		expect(resolveTimeFromColumn({ hour: 0, minute: 0 }, "period", 1)).toEqual({ hour: 12, minute: 0 });
	});
});

describe("resolveColumnAccessibilityValue", () => {
	test("names the unit", () => {
		expect(resolveColumnAccessibilityValue("minute", "30")).toBe("30 minutes");
		expect(resolveColumnAccessibilityValue("minute", "01")).toBe("1 minute");
		expect(resolveColumnAccessibilityValue("second", "15")).toBe("15 seconds");
		expect(resolveColumnAccessibilityValue("hour", "3")).toBe("3 o'clock");
		expect(resolveColumnAccessibilityValue("period", "PM")).toBe("PM");
	});
});
