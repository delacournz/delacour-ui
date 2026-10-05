import { describe, expect, test } from "bun:test";
import {
	clampNumber,
	countDecimals,
	formatNumber,
	getNumberSeparators,
	isOutOfRange,
	NUMBER_INPUT_FAST_TICK,
	NUMBER_INPUT_LARGE_STEP_TICK,
	NUMBER_INPUT_REPEAT_DELAY_MS,
	type NumberInputConfig,
	parseNumberInput,
	reconcile,
	resolveDraftCommit,
	resolveNumberInputKeyboard,
	resolvePrecision,
	resolveRepeatInterval,
	resolveRepeatMultiplier,
	resolveStepHaptic,
	resolveStepperState,
	roundToPrecision,
	sanitizeDraft,
	snapToStep,
	stepValue,
	toEditableString,
} from "./number-input.format";

const UNBOUNDED: NumberInputConfig = {
	max: Number.POSITIVE_INFINITY,
	min: Number.NEGATIVE_INFINITY,
	precision: 0,
	step: 1,
};

describe("countDecimals", () => {
	test.each([
		[1, 0],
		[0.5, 1],
		[0.25, 2],
		[1e-7, 7],
		[1.1, 1],
		[-2.75, 2],
		[1.5e-10, 11],
		[Number.POSITIVE_INFINITY, 0],
	])("%p has %p decimals", (value, expected) => {
		expect(countDecimals(value)).toBe(expected);
	});
});

describe("resolvePrecision", () => {
	test("an explicit precision wins", () => {
		expect(resolvePrecision({ min: 0.125, precision: 1, step: 0.25 })).toBe(1);
	});

	test("otherwise the larger of the step's and a finite min's decimals", () => {
		expect(resolvePrecision({ min: 0, step: 0.25 })).toBe(2);
		expect(resolvePrecision({ min: 0.125, step: 0.5 })).toBe(3);
		expect(resolvePrecision({ min: Number.NEGATIVE_INFINITY, step: 1 })).toBe(0);
	});
});

describe("roundToPrecision", () => {
	test("0.1 + 0.2 rounds to 0.3", () => {
		expect(roundToPrecision(0.1 + 0.2, 1)).toBe(0.3);
	});

	test("1.005 rounds up at 2, where toFixed rounds it down", () => {
		expect((1.005).toFixed(2)).toBe("1.00");
		expect(roundToPrecision(1.005, 2)).toBe(1.01);
	});

	test("rounds half away from zero on both sides", () => {
		expect(roundToPrecision(2.5, 0)).toBe(3);
		expect(roundToPrecision(-2.5, 0)).toBe(-3);
	});

	test("normalises negative zero", () => {
		expect(Object.is(roundToPrecision(-0.0001, 2), 0)).toBe(true);
	});

	test("handles exponent-notation input", () => {
		expect(roundToPrecision(1e-7, 7)).toBe(1e-7);
		expect(roundToPrecision(1e-7, 2)).toBe(0);
	});
});

describe("snapToStep", () => {
	test("snaps to the nearest multiple from zero without a finite min", () => {
		expect(snapToStep(7, { min: 0, step: 5 })).toBe(5);
		expect(snapToStep(8, { min: 0, step: 5 })).toBe(10);
		expect(snapToStep(-7, { min: Number.NEGATIVE_INFINITY, step: 5 })).toBe(-5);
	});

	test("a midpoint rounds up", () => {
		expect(snapToStep(7.5, { min: 0, step: 5 })).toBe(10);
		expect(snapToStep(4, { min: 1, step: 2 })).toBe(5);
	});

	test("measures from a finite min", () => {
		expect(snapToStep(3.9, { min: 1, step: 2 })).toBe(3);
	});

	test("fractional steps land exactly", () => {
		expect(snapToStep(0.3, { min: 0, step: 0.1 })).toBe(0.3);
		expect(snapToStep(0.25, { min: 0, step: 0.1 })).toBe(0.3);
	});
});

describe("clampNumber", () => {
	test("clamps to both bounds", () => {
		expect(clampNumber(5, 0, 10)).toBe(5);
		expect(clampNumber(-1, 0, 10)).toBe(0);
		expect(clampNumber(11, 0, 10)).toBe(10);
	});

	test("infinite bounds clamp nothing", () => {
		expect(clampNumber(1e9, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)).toBe(1e9);
	});

	test("min above max throws outside production", () => {
		expect(() => clampNumber(5, 10, 0)).toThrow(RangeError);
	});
});

describe("reconcile", () => {
	const config: NumberInputConfig = { max: 10, min: 0, precision: 0, step: 3 };

	test("snaps, then clamps onto the grid", () => {
		expect(reconcile(4, config)).toBe(3);
		expect(reconcile(-4, config)).toBe(0);
	});

	test("snapping near max never exceeds it", () => {
		expect(reconcile(10, config)).toBe(9);
		expect(reconcile(11, config)).toBe(9);
		expect(reconcile(100, config)).toBe(9);
	});

	test("rounds to precision", () => {
		expect(reconcile(0.1 + 0.2, { ...UNBOUNDED, precision: 1, step: 0.1 })).toBe(0.3);
	});

	test("clamps to max when max sits on the grid", () => {
		expect(reconcile(12, { max: 10, min: 0, precision: 0, step: 5 })).toBe(10);
	});
});

describe("stepValue", () => {
	const config: NumberInputConfig = { max: 10, min: 0, precision: 0, step: 1 };

	test("an empty start goes to zero, clamped into range", () => {
		expect(stepValue(null, 1, config)).toEqual({ blocked: false, reachedLimit: false, value: 0 });
		expect(stepValue(null, -1, { ...config, min: 1 })).toEqual({ blocked: false, reachedLimit: true, value: 1 });
		expect(stepValue(null, 1, { ...config, max: -5, min: -10 }).value).toBe(-5);
	});

	test("steps by step times the multiplier", () => {
		expect(stepValue(3, 1, config).value).toBe(4);
		expect(stepValue(3, -1, config).value).toBe(2);
		expect(stepValue(0, 1, { ...UNBOUNDED, step: 2 }, 10).value).toBe(20);
	});

	test("is blocked at a limit", () => {
		expect(stepValue(10, 1, config)).toEqual({ blocked: true, reachedLimit: true, value: 10 });
		expect(stepValue(0, -1, config)).toEqual({ blocked: true, reachedLimit: true, value: 0 });
	});

	test("reports the step that lands on a limit", () => {
		expect(stepValue(9, 1, config)).toEqual({ blocked: false, reachedLimit: true, value: 10 });
	});

	test("a large step overshooting the limit lands on it", () => {
		expect(stepValue(995, 1, { ...config, max: 1000 }, 10)).toEqual({
			blocked: false,
			reachedLimit: true,
			value: 1000,
		});
	});

	test("fractional steps accumulate without drift", () => {
		const tenth: NumberInputConfig = { ...UNBOUNDED, precision: 1, step: 0.1 };
		let value: number | null = 0;
		for (let i = 0; i < 10; i += 1) value = stepValue(value, 1, tenth).value;
		expect(value).toBe(1);
	});
});

describe("getNumberSeparators", () => {
	test("en-NZ", () => {
		expect(getNumberSeparators("en-NZ")).toEqual({ decimal: ".", group: "," });
	});

	test("de-DE", () => {
		expect(getNumberSeparators("de-DE")).toEqual({ decimal: ",", group: "." });
	});

	test("fr-FR groups with a narrow no-break space", () => {
		expect(getNumberSeparators("fr-FR")).toEqual({ decimal: ",", group: " " });
	});

	test("an invalid locale falls back to English", () => {
		expect(getNumberSeparators("not a locale!")).toEqual({ decimal: ".", group: "," });
	});
});

describe("parseNumberInput", () => {
	test("plain numbers", () => {
		expect(parseNumberInput("12.5", "en")).toEqual({ kind: "number", value: 12.5 });
		expect(parseNumberInput("-3", "en")).toEqual({ kind: "number", value: -3 });
		expect(parseNumberInput(".5", "en")).toEqual({ kind: "number", value: 0.5 });
	});

	test("the locale's decimal separator", () => {
		expect(parseNumberInput("12,5", "de-DE")).toEqual({ kind: "number", value: 12.5 });
		expect(parseNumberInput("1.234,5", "de-DE")).toEqual({ kind: "number", value: 1234.5 });
	});

	test("group separators are dropped", () => {
		expect(parseNumberInput("1,234.5", "en")).toEqual({ kind: "number", value: 1234.5 });
		expect(parseNumberInput("1 234,5", "fr-FR")).toEqual({ kind: "number", value: 1234.5 });
	});

	test("empty", () => {
		expect(parseNumberInput("", "en")).toEqual({ kind: "empty" });
		expect(parseNumberInput("  ", "en")).toEqual({ kind: "empty" });
	});

	test("half-typed entries are partial", () => {
		expect(parseNumberInput("-", "en")).toEqual({ kind: "partial", value: null });
		expect(parseNumberInput(".", "en")).toEqual({ kind: "partial", value: null });
		expect(parseNumberInput("-.", "en")).toEqual({ kind: "partial", value: null });
		expect(parseNumberInput("1.", "en")).toEqual({ kind: "partial", value: 1 });
		expect(parseNumberInput("-1,", "de-DE")).toEqual({ kind: "partial", value: -1 });
	});

	test("garbage is invalid", () => {
		expect(parseNumberInput("abc", "en")).toEqual({ kind: "invalid" });
		expect(parseNumberInput("--1", "en")).toEqual({ kind: "invalid" });
		expect(parseNumberInput("1.2.3", "en")).toEqual({ kind: "invalid" });
		expect(parseNumberInput("1-", "en")).toEqual({ kind: "invalid" });
	});

	test("a leading plus is accepted", () => {
		expect(parseNumberInput("+4", "en")).toEqual({ kind: "number", value: 4 });
	});

	test("Arabic-Indic digits are normalised", () => {
		expect(parseNumberInput("١٢٣", "en")).toEqual({ kind: "number", value: 123 });
		expect(parseNumberInput("۴۵", "en")).toEqual({ kind: "number", value: 45 });
	});
});

describe("sanitizeDraft", () => {
	const both = { allowDecimal: true, allowNegative: true };

	test("strips illegal characters", () => {
		expect(sanitizeDraft("1a2b3", "en", both)).toBe("123");
		expect(sanitizeDraft("1,234.5", "en", both)).toBe("1234.5");
	});

	test("keeps one decimal separator", () => {
		expect(sanitizeDraft("1.2.3", "en", both)).toBe("1.23");
		expect(sanitizeDraft("1,2,3", "de-DE", both)).toBe("1,23");
	});

	test("a minus only at the start, and only when negatives are allowed", () => {
		expect(sanitizeDraft("-12-3", "en", both)).toBe("-123");
		expect(sanitizeDraft("1-2", "en", both)).toBe("12");
		expect(sanitizeDraft("-12", "en", { ...both, allowNegative: false })).toBe("12");
	});

	test("no separator when decimals are not allowed", () => {
		expect(sanitizeDraft("1.5", "en", { ...both, allowDecimal: false })).toBe("15");
	});

	test("normalises Arabic-Indic digits", () => {
		expect(sanitizeDraft("١٢", "en", both)).toBe("12");
	});
});

describe("formatNumber", () => {
	test("groups and keeps the precision", () => {
		expect(formatNumber(1234.5, { locale: "en", precision: 1 })).toBe("1,234.5");
		expect(formatNumber(1234.5, { locale: "en", precision: 2 })).toBe("1,234.50");
	});

	test("null is empty", () => {
		expect(formatNumber(null, { locale: "en", precision: 0 })).toBe("");
	});

	test("currency keeps its own fraction digits when precision asks for fewer", () => {
		expect(
			formatNumber(19.5, { formatOptions: { currency: "NZD", style: "currency" }, locale: "en-NZ", precision: 1 })
		).toBe("$19.50");
	});

	test("explicit fraction digits in formatOptions win", () => {
		expect(formatNumber(2, { formatOptions: { maximumFractionDigits: 0 }, locale: "en", precision: 2 })).toBe("2");
	});

	test("percent takes two fewer decimals than the raw value", () => {
		expect(formatNumber(0.255, { formatOptions: { style: "percent" }, locale: "en", precision: 3 })).toBe("25.5%");
	});

	test("units format", () => {
		expect(formatNumber(5, { formatOptions: { style: "unit", unit: "kilogram" }, locale: "en", precision: 0 })).toBe(
			"5 kg"
		);
	});
});

describe("toEditableString", () => {
	test("no grouping, the locale's separator", () => {
		expect(toEditableString(1234.5, "de-DE", 1)).toBe("1234,5");
		expect(toEditableString(1234.5, "en", 2)).toBe("1234.5");
	});

	test("null is empty", () => {
		expect(toEditableString(null, "en", 0)).toBe("");
	});
});

describe("resolveRepeatInterval", () => {
	test.each([
		[0, 160],
		[4, 160],
		[5, 90],
		[14, 90],
		[15, 45],
		[100, 45],
	])("tick %p waits %pms", (tick, expected) => {
		expect(resolveRepeatInterval(tick)).toBe(expected);
	});

	test("the first repeat waits longer", () => {
		expect(NUMBER_INPUT_REPEAT_DELAY_MS).toBe(400);
	});
});

describe("resolveRepeatMultiplier", () => {
	test("goes large from tick 25", () => {
		expect(NUMBER_INPUT_LARGE_STEP_TICK).toBe(25);
		expect(resolveRepeatMultiplier(24, 10)).toBe(1);
		expect(resolveRepeatMultiplier(25, 10)).toBe(10);
		expect(resolveRepeatMultiplier(25, 1)).toBe(1);
	});
});

describe("resolveStepHaptic", () => {
	test("an applied step ticks", () => {
		expect(resolveStepHaptic({ outcome: "applied", tick: 0 })).toBe("step");
	});

	test("reaching or bumping a limit plays the limit haptic", () => {
		expect(resolveStepHaptic({ outcome: "reached-limit", tick: 3 })).toBe("limit");
		expect(resolveStepHaptic({ outcome: "blocked", tick: 0 })).toBe("limit");
	});

	test("fast ticks skip every other haptic", () => {
		expect(NUMBER_INPUT_FAST_TICK).toBe(15);
		expect(resolveStepHaptic({ outcome: "applied", tick: 15 })).toBeNull();
		expect(resolveStepHaptic({ outcome: "applied", tick: 16 })).toBe("step");
		expect(resolveStepHaptic({ outcome: "applied", tick: 13 })).toBe("step");
	});

	test("a limit always plays, even on a skipped tick", () => {
		expect(resolveStepHaptic({ outcome: "reached-limit", tick: 15 })).toBe("limit");
	});
});

describe("resolveStepperState", () => {
	const config: NumberInputConfig = { max: 10, min: 0, precision: 0, step: 1 };
	const idle = { isDisabled: false, isReadOnly: false };

	test("an empty value enables both", () => {
		expect(resolveStepperState({ ...idle, config, value: null })).toEqual({ canDecrement: true, canIncrement: true });
	});

	test("at min and at max", () => {
		expect(resolveStepperState({ ...idle, config, value: 0 })).toEqual({ canDecrement: false, canIncrement: true });
		expect(resolveStepperState({ ...idle, config, value: 10 })).toEqual({ canDecrement: true, canIncrement: false });
	});

	test("an off-grid max disables increment at the last grid value", () => {
		expect(resolveStepperState({ ...idle, config: { ...config, step: 3 }, value: 9 }).canIncrement).toBe(false);
	});

	test("read-only and disabled turn both off", () => {
		expect(resolveStepperState({ ...idle, config, isReadOnly: true, value: 5 })).toEqual({
			canDecrement: false,
			canIncrement: false,
		});
		expect(resolveStepperState({ ...idle, config, isDisabled: true, value: 5 })).toEqual({
			canDecrement: false,
			canIncrement: false,
		});
	});
});

describe("resolveDraftCommit", () => {
	const config: NumberInputConfig = { max: 10, min: 0, precision: 1, step: 0.5 };
	const base = { commitMode: "clamp", config, locale: "en", value: 4 } as const;

	test("an empty draft commits empty", () => {
		expect(resolveDraftCommit({ ...base, draft: "" })).toBeNull();
	});

	test("a bare minus or separator reverts", () => {
		expect(resolveDraftCommit({ ...base, draft: "-" })).toBe(4);
		expect(resolveDraftCommit({ ...base, draft: "." })).toBe(4);
	});

	test("a trailing separator commits the number before it", () => {
		expect(resolveDraftCommit({ ...base, draft: "7." })).toBe(7);
	});

	test("garbage reverts", () => {
		expect(resolveDraftCommit({ ...base, draft: "abc" })).toBe(4);
	});

	test("clamp mode reconciles", () => {
		expect(resolveDraftCommit({ ...base, draft: "7.3" })).toBe(7.5);
		expect(resolveDraftCommit({ ...base, draft: "40" })).toBe(10);
	});

	test("validate mode keeps an out-of-range number, snapped", () => {
		expect(resolveDraftCommit({ ...base, commitMode: "validate", draft: "40.3" })).toBe(40.5);
		expect(resolveDraftCommit({ ...base, commitMode: "validate", draft: "7.3" })).toBe(7.5);
	});
});

describe("isOutOfRange", () => {
	test("null is never out of range", () => {
		expect(isOutOfRange(null, 0, 10)).toBe(false);
		expect(isOutOfRange(11, 0, 10)).toBe(true);
		expect(isOutOfRange(-1, 0, 10)).toBe(true);
		expect(isOutOfRange(5, 0, 10)).toBe(false);
	});
});

describe("resolveNumberInputKeyboard", () => {
	test("whole non-negative numbers get the numeric pad", () => {
		expect(resolveNumberInputKeyboard({ min: 0, platform: "ios", precision: 0 })).toEqual({ inputMode: "numeric" });
	});

	test("decimals get the decimal pad", () => {
		expect(resolveNumberInputKeyboard({ min: 0, platform: "ios", precision: 2 })).toEqual({ inputMode: "decimal" });
	});

	test("negatives on iOS fall back to numbers and punctuation", () => {
		expect(resolveNumberInputKeyboard({ min: -5, platform: "ios", precision: 0 })).toEqual({
			keyboardType: "numbers-and-punctuation",
		});
		expect(
			resolveNumberInputKeyboard({ min: Number.NEGATIVE_INFINITY, platform: "ios", precision: 1 }).keyboardType
		).toBe("numbers-and-punctuation");
	});

	test("negatives on Android use the signed numeric keyboard", () => {
		expect(resolveNumberInputKeyboard({ min: -5, platform: "android", precision: 0 })).toEqual({
			keyboardType: "numeric",
		});
	});
});
