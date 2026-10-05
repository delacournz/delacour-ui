/**
 * The arithmetic, parsing and formatting behind `NumberInput`.
 *
 * Every path into the value — a stepper tap, a held repeat, a committed draft,
 * an accessibility action — funnels through {@link reconcile}, so a value can
 * only ever be on the step grid, inside the bounds and at the precision. This
 * module is the whole of that decision and imports nothing, so `bun test`
 * reaches every branch of it. See AGENTS.md.
 */

/** A number input's value. `null` is empty — a field with nothing typed in it. */
export type NumberInputValue = number | null;

/** What a draft commits as: the clamped value, or the typed value left to be flagged. */
export type NumberInputCommitMode = "clamp" | "validate";

/** Everything {@link reconcile} needs to put a number on the grid. */
export type NumberInputConfig = {
	min: number;
	max: number;
	/** Always greater than zero. */
	step: number;
	/** Decimal places kept. */
	precision: number;
};

export type NumberSeparators = {
	decimal: string;
	group: string;
};

/**
 * What a piece of typed text means.
 *
 * `partial` is text that is on its way to a number — a lone minus, a lone
 * separator, a trailing separator. It carries the number it already spells, if
 * any (`"1."` is `1`), so a commit can keep it rather than revert.
 */
export type ParsedNumberInput =
	| { kind: "empty" }
	| { kind: "partial"; value: number | null }
	| { kind: "invalid" }
	| { kind: "number"; value: number };

/** Wait before a held stepper starts repeating. */
export const NUMBER_INPUT_REPEAT_DELAY_MS = 400;

/** The repeat tick from which steps multiply by `largeStepMultiplier`. */
export const NUMBER_INPUT_LARGE_STEP_TICK = 25;

/** The repeat tick from which the interval is short enough to skip every other haptic. */
export const NUMBER_INPUT_FAST_TICK = 15;

/** The default multiplier a long hold steps by. */
export const NUMBER_INPUT_LARGE_STEP_MULTIPLIER = 10;

const FALLBACK_LOCALE = "en";

/** Decimal places `n` is written with, exponent notation included. `1e-7` has seven. */
export function countDecimals(n: number): number {
	if (!Number.isFinite(n)) return 0;
	const [mantissa = "", exponent = "0"] = String(Math.abs(n)).split("e");
	const fraction = mantissa.split(".")[1]?.length ?? 0;
	return Math.max(0, fraction - Number(exponent));
}

/**
 * Decimal places a number input keeps.
 *
 * An explicit precision wins. Otherwise the step's decimals, or a finite min's
 * if it has more — a min of `0.125` with a step of `0.5` puts the grid on
 * eighths, and rounding to tenths would throw the grid away.
 */
export function resolvePrecision({ step, min, precision }: { step: number; min: number; precision?: number }): number {
	if (precision !== undefined) return precision;
	return Math.max(countDecimals(step), Number.isFinite(min) ? countDecimals(min) : 0);
}

/**
 * Rounds half away from zero at `precision` decimal places, by shifting the
 * exponent in the number's own string rather than multiplying.
 *
 * `1.005 * 100` is `100.49999999999999` in a double, so the textbook
 * `Math.round(v * 100) / 100` — and `toFixed` — round it down. Shifting the
 * exponent in the decimal string reads `1.005e2` as exactly `100.5`. Negative
 * zero comes out as zero, so it never formats as `-0`.
 */
export function roundToPrecision(value: number, precision: number): number {
	if (!Number.isFinite(value)) return value;
	const shift = (n: number, by: number): number => {
		const [mantissa, exponent = "0"] = String(n).split("e");
		return Number(`${mantissa}e${Number(exponent) + by}`);
	};
	const magnitude = shift(Math.round(shift(Math.abs(value), precision)), -precision);
	const rounded = value < 0 ? -magnitude : magnitude;
	return rounded === 0 ? 0 : rounded;
}

/** The point the step grid is measured from: a finite min, or zero. */
function gridBase(min: number): number {
	return Number.isFinite(min) ? min : 0;
}

/** Decimals the grid itself is written in, so a snapped value carries no float noise. */
function gridPrecision(step: number, base: number): number {
	return Math.max(countDecimals(step), countDecimals(base));
}

/**
 * The nearest point on the step grid, measured from a finite min or from zero.
 * A midpoint rounds up.
 *
 * The step count is itself rounded before it is floored: `0.25 / 0.1` is
 * `2.4999999999999996` in a double, which would floor a value sitting exactly
 * on a midpoint down instead of up.
 */
export function snapToStep(value: number, { step, min }: { step: number; min: number }): number {
	const base = gridBase(min);
	const steps = Math.floor(roundToPrecision((value - base) / step, 10) + 0.5);
	return roundToPrecision(base + steps * step, gridPrecision(step, base));
}

/** `value` held inside `[min, max]`. A min above the max is a caller bug, thrown outside production. */
export function clampNumber(value: number, min: number, max: number): number {
	if (min > max) {
		if (process.env.NODE_ENV !== "production") {
			throw new RangeError(`NumberInput: min (${min}) is greater than max (${max}).`);
		}
		return min;
	}
	return Math.min(max, Math.max(min, value));
}

/**
 * Puts a number on the grid: rounded, snapped to the step, then held inside the
 * bounds without leaving the grid.
 *
 * A max that is not on the grid is never reached — `max: 10, step: 3` tops out
 * at 9. Clamping straight to 10 would hand back a value no stepper could have
 * produced, and the next decrement would land on 7 rather than 6.
 */
export function reconcile(value: number, config: NumberInputConfig): number {
	const { min, max, step, precision } = config;
	const snapped = snapToStep(roundToPrecision(value, Math.max(precision, gridPrecision(step, gridBase(min)))), {
		min,
		step,
	});
	let held = clampNumber(snapped, min, max);
	if (snapped > max) {
		const base = gridBase(min);
		const lastOnGrid = base + Math.floor(roundToPrecision((max - base) / step, 10)) * step;
		held = Math.max(min, roundToPrecision(lastOnGrid, gridPrecision(step, base)));
	}
	return roundToPrecision(held, precision);
}

/** What one step did. */
export type StepResult = {
	value: number;
	/** The step changed nothing, because the value already sat at the limit. */
	blocked: boolean;
	/** The value now sits at the limit in the direction of travel. */
	reachedLimit: boolean;
};

/**
 * One step from `current`, in `direction`, `multiplier` steps long.
 *
 * An empty value steps to zero held inside the bounds, never to `NaN`: with a
 * min of 1 that is 1, and with a range wholly below zero it is the max.
 */
export function stepValue(
	current: NumberInputValue,
	direction: 1 | -1,
	config: NumberInputConfig,
	multiplier = 1
): StepResult {
	const atLimit = (value: number): boolean =>
		reconcile(value + direction * config.step, config) === value ||
		(direction === 1 ? value >= config.max : value <= config.min);

	if (current === null) {
		const value = reconcile(clampNumber(0, config.min, config.max), config);
		return { blocked: false, reachedLimit: atLimit(value), value };
	}

	const value = reconcile(current + direction * config.step * multiplier, config);
	const moved = direction === 1 ? value > current : value < current;
	if (!moved) return { blocked: true, reachedLimit: true, value: current };
	return { blocked: false, reachedLimit: atLimit(value), value };
}

/** The decimal and group separators a locale writes numbers with. Falls back to English on an invalid locale. */
export function getNumberSeparators(locale?: string): NumberSeparators {
	let parts: Intl.NumberFormatPart[];
	try {
		parts = new Intl.NumberFormat(locale).formatToParts(11111.1);
	} catch {
		parts = new Intl.NumberFormat(FALLBACK_LOCALE).formatToParts(11111.1);
	}
	return {
		decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
		group: parts.find((part) => part.type === "group")?.value ?? ",",
	};
}

/** Arabic-Indic and Extended Arabic-Indic digits, rewritten as ASCII. */
function normaliseDigits(text: string): string {
	return text.replace(/[٠-٩۰-۹]/g, (digit) => {
		const code = digit.charCodeAt(0);
		return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
	});
}

/** A group separator is a space in some locales, and people type the ordinary one. */
function isGroupCharacter(char: string, group: string): boolean {
	if (char === group) return true;
	return /\s/.test(group) && /\s/.test(char);
}

/**
 * Reads typed text as a number in `locale`.
 *
 * Group separators are dropped and the locale's decimal separator is read as
 * the decimal point, so `"1.234,5"` in German is `1234.5`. A leading plus is
 * accepted. Half-typed text — `"-"`, `"."`, `"1."` — is `partial` rather than
 * `invalid`, because it is exactly what a person is about to finish typing.
 */
export function parseNumberInput(text: string, locale?: string): ParsedNumberInput {
	const { decimal, group } = getNumberSeparators(locale);
	let normalised = "";
	for (const char of normaliseDigits(text).trim()) {
		if (char === decimal) normalised += ".";
		else if (!isGroupCharacter(char, group)) normalised += char;
	}
	if (normalised.startsWith("+")) normalised = normalised.slice(1);

	if (normalised === "") return { kind: "empty" };
	if (/^-?\.?$/.test(normalised)) return { kind: "partial", value: null };
	if (/^-?\d+\.$/.test(normalised)) return { kind: "partial", value: Number(normalised.slice(0, -1)) };
	if (/^-?(\d+(\.\d+)?|\.\d+)$/.test(normalised)) return { kind: "number", value: Number(normalised) };
	return { kind: "invalid" };
}

/**
 * Typed text with everything a number cannot hold removed: digits, at most one
 * of the locale's decimal separator, and a minus only at the very start.
 *
 * Group separators go too — the editor shows the bare number, and a grouping
 * typed by hand would only be dropped again on commit.
 */
export function sanitizeDraft(
	text: string,
	locale: string | undefined,
	{ allowNegative, allowDecimal }: { allowNegative: boolean; allowDecimal: boolean }
): string {
	const { decimal } = getNumberSeparators(locale);
	let output = "";
	let hasDecimal = false;
	for (const [index, char] of [...normaliseDigits(text)].entries()) {
		if (/\d/.test(char)) {
			output += char;
		} else if (char === "-" && index === 0 && allowNegative) {
			output += char;
		} else if (char === decimal && allowDecimal && !hasDecimal) {
			output += char;
			hasDecimal = true;
		}
	}
	return output;
}

/** Whether a caller's format options already decide how many decimals to draw. */
function namesFractionDigits(options: Intl.NumberFormatOptions): boolean {
	return (
		options.minimumFractionDigits !== undefined ||
		options.maximumFractionDigits !== undefined ||
		options.minimumSignificantDigits !== undefined ||
		options.maximumSignificantDigits !== undefined
	);
}

/** A `Intl.NumberFormat`, falling back to English on an invalid locale. */
function createFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
	try {
		return new Intl.NumberFormat(locale, options);
	} catch {
		return new Intl.NumberFormat(FALLBACK_LOCALE, options);
	}
}

/**
 * The options a value is displayed with while the field is not being edited.
 *
 * Grouping on, and exactly `precision` decimals, so `1234.5` at precision 2 is
 * `1,234.50`. A style with its own idea of decimals is not overruled
 * downwards: a currency keeps its two cents at precision 1. A percentage shows
 * two fewer, because the raw value is a fraction. Explicit fraction or
 * significant digits in `formatOptions` win outright.
 */
export function resolveFormatOptions(
	locale: string | undefined,
	precision: number,
	formatOptions: Intl.NumberFormatOptions = {}
): Intl.NumberFormatOptions {
	if (namesFractionDigits(formatOptions)) return { useGrouping: true, ...formatOptions };
	const native = createFormatter(locale, formatOptions).resolvedOptions();
	const shown = formatOptions.style === "percent" ? Math.max(0, precision - 2) : precision;
	const minimum = Math.max(shown, native.minimumFractionDigits ?? 0);
	return {
		useGrouping: true,
		...formatOptions,
		maximumFractionDigits: Math.max(minimum, shown),
		minimumFractionDigits: minimum,
	};
}

/** A value as the field shows it at rest. `null` is the empty string, so the placeholder shows. */
export function formatNumber(
	value: NumberInputValue,
	{ locale, precision, formatOptions }: { locale?: string; precision: number; formatOptions?: Intl.NumberFormatOptions }
): string {
	if (value === null) return "";
	return createFormatter(locale, resolveFormatOptions(locale, precision, formatOptions)).format(value);
}

/**
 * A value as the field shows it while being edited: the bare number, in the
 * locale's decimal separator, with no grouping, currency or unit.
 *
 * What a person types is what {@link parseNumberInput} reads, so the editor
 * shows only what they could have typed themselves.
 */
export function toEditableString(value: NumberInputValue, locale: string | undefined, precision: number): string {
	if (value === null) return "";
	return createFormatter(locale, {
		maximumFractionDigits: Math.min(20, precision),
		minimumFractionDigits: 0,
		useGrouping: false,
	}).format(value);
}

/** Milliseconds between repeats, `tick` repeats into a hold. It shortens twice. */
export function resolveRepeatInterval(tick: number): number {
	if (tick < 5) return 160;
	if (tick < NUMBER_INPUT_FAST_TICK) return 90;
	return 45;
}

/** How many steps one repeat moves, `tick` repeats into a hold. */
export function resolveRepeatMultiplier(tick: number, largeStepMultiplier: number): number {
	return tick >= NUMBER_INPUT_LARGE_STEP_TICK ? largeStepMultiplier : 1;
}

/** What one stepper tick did, as far as the haptic is concerned. */
export type StepOutcome = "applied" | "reached-limit" | "blocked";

/**
 * Which haptic a tick plays: `step` per applied step, `limit` when the value
 * reaches or bumps a bound, or nothing.
 *
 * From the fast tick on, a repeat comes every 45ms — over twenty a second, which
 * reads as a buzz rather than as ticks — so every other one is skipped. A limit
 * always plays: it happens once a hold, and it is the haptic that says why the
 * value stopped.
 */
export function resolveStepHaptic({ outcome, tick }: { outcome: StepOutcome; tick: number }): "step" | "limit" | null {
	if (outcome !== "applied") return "limit";
	if (tick >= NUMBER_INPUT_FAST_TICK && tick % 2 === 1) return null;
	return "step";
}

/**
 * Whether each stepper can move the value.
 *
 * Asked of {@link stepValue} rather than compared against the bounds, so an
 * off-grid max disables increment at the last value the grid reaches — 9, with
 * a max of 10 and a step of 3 — rather than leaving a button that does nothing.
 */
export function resolveStepperState({
	value,
	config,
	isDisabled,
	isReadOnly,
}: {
	value: NumberInputValue;
	config: NumberInputConfig;
	isDisabled: boolean;
	isReadOnly: boolean;
}): { canDecrement: boolean; canIncrement: boolean } {
	if (isDisabled || isReadOnly) return { canDecrement: false, canIncrement: false };
	if (value === null) return { canDecrement: true, canIncrement: true };
	return {
		canDecrement: !stepValue(value, -1, config).blocked,
		canIncrement: !stepValue(value, 1, config).blocked,
	};
}

/**
 * The value a draft commits as, on blur or submit.
 *
 * Empty text commits empty. Text that spells no number — a lone minus, garbage —
 * reverts to `value`. A number is reconciled; in `validate` mode it is rounded
 * and snapped but left outside the bounds, so the field can flag it instead of
 * silently changing what was typed.
 */
export function resolveDraftCommit({
	draft,
	value,
	config,
	locale,
	commitMode,
}: {
	draft: string;
	value: NumberInputValue;
	config: NumberInputConfig;
	locale?: string;
	commitMode: NumberInputCommitMode;
}): NumberInputValue {
	const parsed = parseNumberInput(draft, locale);
	let typed: number;
	switch (parsed.kind) {
		case "empty":
			return null;
		case "invalid":
			return value;
		case "partial":
			if (parsed.value === null) return value;
			typed = parsed.value;
			break;
		case "number":
			typed = parsed.value;
			break;
		default:
			return value;
	}
	if (commitMode === "clamp") return reconcile(typed, config);
	return reconcile(typed, { ...config, max: Number.POSITIVE_INFINITY, min: Number.NEGATIVE_INFINITY });
}

/** Whether a value sits outside the bounds. Empty never does. */
export function isOutOfRange(value: NumberInputValue, min: number, max: number): boolean {
	return value !== null && (value < min || value > max);
}

/** The soft keyboard a number input asks for. */
export type NumberInputKeyboard =
	| { inputMode: "numeric" | "decimal"; keyboardType?: never }
	| { inputMode?: never; keyboardType: "numbers-and-punctuation" | "numeric" };

/**
 * The keyboard for the values a field can hold.
 *
 * Whole non-negative numbers get the digit pad, decimals the decimal pad. Neither
 * iOS pad has a minus key, so a field that can go negative falls back to
 * numbers-and-punctuation there; Android's `numeric` keyboard is signed and
 * decimal already.
 */
export function resolveNumberInputKeyboard({
	precision,
	min,
	platform,
}: {
	precision: number;
	min: number;
	platform: string;
}): NumberInputKeyboard {
	if (min < 0) {
		return { keyboardType: platform === "ios" ? "numbers-and-punctuation" : "numeric" };
	}
	return { inputMode: precision === 0 ? "numeric" : "decimal" };
}
