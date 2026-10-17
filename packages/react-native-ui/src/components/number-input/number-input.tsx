import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { useFieldContext } from "../field/field.context";
import type { InputSize, InputVariant } from "../input/input.variants";
import { InputGroup } from "../input/input-group";
import type { HapticFeedback } from "../pressable";
import { type NumberInputInternalContextValue, NumberInputProvider } from "./number-input.context";
import {
	formatNumber,
	isDraftOutOfRange,
	isOutOfRange,
	NUMBER_INPUT_LARGE_STEP_MULTIPLIER,
	type NumberInputCommitMode,
	type NumberInputConfig,
	type NumberInputValue,
	reconcile,
	resolveDraftCommit,
	resolvePrecision,
	resolveStepperState,
	type StepResult,
	sanitizeDraft,
	stepValue,
	toEditableString,
} from "./number-input.format";
import type { NumberInputFieldOwnProps } from "./number-input.types";
import { NUMBER_INPUT_GROUP_CLASS } from "./number-input.variants";
import { NumberInputDecrement } from "./number-input-decrement";
import { NumberInputField } from "./number-input-field";
import { NumberInputIncrement } from "./number-input-increment";

export type NumberInputProps = {
	/** Controlled value. `null` is empty. */
	value?: NumberInputValue;
	/** Starting value while uncontrolled. Default `null`. */
	defaultValue?: NumberInputValue;
	/** Fires on a committed change only — a step, or a draft on blur or submit. Never per keystroke. */
	onValueChange?: (value: NumberInputValue) => void;
	/** Default `-Infinity`. */
	min?: number;
	/** Default `Infinity`. */
	max?: number;
	/** The grid the value snaps to, measured from a finite `min` or from zero. Default 1; must be above 0. */
	step?: number;
	/** Decimal places kept. Default: the decimals of `step`, or of a finite `min` if it has more. */
	precision?: number;
	/** What a hold multiplies the step by once it has run 25 repeats. Default 10; `1` turns it off. */
	largeStepMultiplier?: number;
	/** `Intl` locale for parsing and display. Default: the device's. */
	locale?: string;
	/** Display formatting while the field is not being edited — a currency, a unit, a percentage. */
	formatOptions?: Intl.NumberFormatOptions;
	/** `false` makes the steppers the only way in; the number is shown but cannot be typed. Default `true`. */
	isEditable?: boolean;
	/**
	 * What a typed value outside the bounds does on commit. `clamp` (the default)
	 * pulls it in; `validate` keeps it and flags the input invalid.
	 */
	commitMode?: NumberInputCommitMode;
	/** The box's look — `Input`'s variants. */
	variant?: InputVariant;
	/** The box's height, type scale and stepper size — `Input`'s sizes. */
	size?: InputSize;
	/** Reports an invalid value. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Blocks the steppers and the field and fades the box. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** The value can be read and selected but not changed: the steppers are off and the field takes no typing. */
	isReadOnly?: boolean;
	/** Played on each step. A step that reaches a limit plays `light` instead. `false` silences both. */
	haptic?: false | HapticFeedback;
	placeholder?: string;
	/** Merged onto the `Input.Group` row. */
	className?: string;
	/** Read by a screen reader. Defaults to an enclosing `Field.Label`'s text. */
	accessibilityLabel?: string;
	/** Forwarded to the `TextInput` — `testID`, `returnKeyType`, focus and submit handlers. */
	inputProps?: NumberInputFieldOwnProps;
	/** A custom anatomy. Defaults to `Decrement`, `Field`, `Increment`. */
	children?: ReactNode;
};

function NumberInputRoot({
	value: valueProp,
	defaultValue = null,
	onValueChange,
	min = Number.NEGATIVE_INFINITY,
	max = Number.POSITIVE_INFINITY,
	step = 1,
	precision: precisionProp,
	largeStepMultiplier = NUMBER_INPUT_LARGE_STEP_MULTIPLIER,
	locale,
	formatOptions,
	isEditable = true,
	commitMode = "clamp",
	variant = "primary",
	size = "md",
	isInvalid,
	isDisabled,
	isReadOnly = false,
	haptic = "selection",
	placeholder,
	className,
	accessibilityLabel,
	inputProps,
	children,
}: NumberInputProps): ReactElement {
	if (process.env.NODE_ENV !== "production" && !(step > 0)) {
		throw new RangeError(`NumberInput: step must be greater than 0, received ${step}.`);
	}

	const field = useFieldContext();
	const fieldRef = useRef<TextInput | null>(null);
	const precision = resolvePrecision({ min, precision: precisionProp, step });
	const config = useMemo<NumberInputConfig>(() => ({ max, min, precision, step }), [max, min, precision, step]);

	const [value, setCommitted] = useControllableState<NumberInputValue>({
		defaultValue,
		onChange: onValueChange,
		value: valueProp,
	});

	// The value a step starts from. A hold steps faster than a controlled parent
	// can always re-render, so the next tick reads what the last one committed
	// rather than what the last render happened to hold. It falls back to the
	// rendered value after every render, so a parent that rejects a change wins.
	const latest = useRef(value);
	useEffect(() => {
		latest.current = value;
	}, [value]);

	// The draft is both state (it renders) and a ref (a blur in the same tick as
	// the last keystroke must read that keystroke). `isDirty` is whether it was
	// typed, as opposed to seeded from the value on focus.
	const [draft, setDraftState] = useState<string | null>(null);
	const draftRef = useRef<string | null>(null);
	const isDirty = useRef(false);
	const [isFocused, setFocused] = useState(false);
	const isFocusedRef = useRef(false);

	const setDraft = useCallback((next: string | null, dirty: boolean) => {
		draftRef.current = next;
		isDirty.current = dirty;
		setDraftState(next);
	}, []);

	const commit = useCallback(
		(next: NumberInputValue) => {
			if (next === latest.current) return;
			latest.current = next;
			setCommitted(next);
		},
		[setCommitted]
	);

	const commitDraft = useCallback((): NumberInputValue => {
		const typed = draftRef.current;
		if (typed === null || !isDirty.current) return latest.current;
		const next = resolveDraftCommit({ commitMode, config, draft: typed, locale, value: latest.current });
		commit(next);
		return next;
	}, [commit, commitMode, config, locale]);

	const stepBy = useCallback(
		(direction: 1 | -1, multiplier = 1): StepResult => {
			commitDraft();
			const result = stepValue(latest.current, direction, config, multiplier);
			if (!result.blocked) commit(result.value);
			if (isFocusedRef.current) setDraft(toEditableString(latest.current, locale, precision), false);
			return result;
		},
		[commit, commitDraft, config, locale, precision, setDraft]
	);

	const setValue = useCallback(
		(next: NumberInputValue) => commit(next === null ? null : reconcile(next, config)),
		[commit, config]
	);

	// A controlled value that moves while the field is focused replaces the
	// draft only if nothing has been typed — overwriting a half-typed entry
	// would throw away what the person is in the middle of.
	useEffect(() => {
		if (isFocusedRef.current && !isDirty.current) setDraft(toEditableString(value, locale, precision), false);
	}, [locale, precision, setDraft, value]);

	const onFocus = useCallback(() => {
		isFocusedRef.current = true;
		setFocused(true);
		setDraft(toEditableString(latest.current, locale, precision), false);
	}, [locale, precision, setDraft]);

	const onBlur = useCallback(() => {
		commitDraft();
		isFocusedRef.current = false;
		setFocused(false);
		setDraft(null, false);
	}, [commitDraft, setDraft]);

	const onSubmit = useCallback(() => {
		const next = commitDraft();
		if (isFocusedRef.current) setDraft(toEditableString(next, locale, precision), false);
	}, [commitDraft, locale, precision, setDraft]);

	const onChangeText = useCallback(
		(text: string) => {
			setDraft(sanitizeDraft(text, locale, { allowDecimal: precision > 0, allowNegative: min < 0 }), true);
		},
		[locale, min, precision, setDraft]
	);

	const resolvedIsDisabled = isDisabled ?? field?.isDisabled ?? false;
	const isValidationInvalid =
		commitMode === "validate" && (isOutOfRange(value, min, max) || isDraftOutOfRange(draft, locale, min, max));
	// An explicit `isInvalid` wins either way. Left unset, validation can only
	// turn the group invalid, never calm a `Field` that already is — so it
	// hands `undefined` on and the group falls back to the field.
	const groupIsInvalid = isInvalid ?? (isValidationInvalid ? true : undefined);
	const resolvedIsInvalid = groupIsInvalid ?? field?.isInvalid ?? false;

	const formatted = useMemo(
		() => formatNumber(value, { formatOptions, locale, precision }),
		[formatOptions, locale, precision, value]
	);
	const displayText = isFocused && draft !== null ? draft : formatted;

	const { canDecrement, canIncrement } = resolveStepperState({
		config,
		isDisabled: resolvedIsDisabled,
		isReadOnly,
		value,
	});

	// Offered to an enclosing `Field`, so tapping its label focuses the field —
	// the nearest thing React Native has to `<label for>`. A field that cannot be
	// typed into offers nothing.
	const registerPress = field?.registerPress;
	const canType = isEditable && !isReadOnly && !resolvedIsDisabled;
	useEffect(() => {
		if (!registerPress || !canType) return;
		registerPress(() => fieldRef.current?.focus());
		return () => registerPress(null);
	}, [canType, registerPress]);

	const context = useMemo<NumberInputInternalContextValue>(
		() => ({
			accessibilityLabel: accessibilityLabel ?? field?.label ?? undefined,
			// A screen reader reads what is on screen: the draft while editing, so a
			// half-typed entry is not announced as the value it replaces.
			accessibilityText: displayText,
			canDecrement,
			canIncrement,
			config,
			displayText,
			draft,
			fieldRef,
			haptic,
			inputProps,
			isDisabled: resolvedIsDisabled,
			isEditable,
			isFocused,
			isInvalid: resolvedIsInvalid,
			isReadOnly,
			largeStepMultiplier,
			locale,
			max,
			min,
			onBlur,
			onChangeText,
			onFocus,
			onSubmit,
			placeholder,
			setValue,
			size,
			stepBy,
			value,
			variant,
		}),
		[
			accessibilityLabel,
			canDecrement,
			canIncrement,
			config,
			displayText,
			draft,
			field?.label,
			haptic,
			inputProps,
			isEditable,
			isFocused,
			isReadOnly,
			largeStepMultiplier,
			locale,
			max,
			min,
			onBlur,
			onChangeText,
			onFocus,
			onSubmit,
			placeholder,
			resolvedIsDisabled,
			resolvedIsInvalid,
			setValue,
			size,
			stepBy,
			value,
			variant,
		]
	);

	// The group draws the box — the same one a lone `Input` draws — and owns its
	// axes, so the steppers and the field share one border and one focus ring.
	// Only its gutter is cleared, so the steppers reach the border.
	return (
		<NumberInputProvider value={context}>
			<InputGroup
				className={cn(NUMBER_INPUT_GROUP_CLASS, className)}
				isDisabled={resolvedIsDisabled}
				isInvalid={groupIsInvalid}
				size={size}
				variant={variant}
			>
				{children ?? (
					<>
						<NumberInputDecrement />
						<NumberInputField />
						<NumberInputIncrement />
					</>
				)}
			</InputGroup>
		</NumberInputProvider>
	);
}

/**
 * A number with a minus and a plus either side of it.
 *
 * Tap a stepper to move by `step`; hold it and it repeats after 400ms, then
 * faster, then — 25 repeats in — by `largeStepMultiplier` steps at a time. Or
 * type: while focused the field takes half-typed text (`""`, `"-"`, `"1."`) and
 * commits on blur or submit, so it never fights the person typing.
 *
 * Every path — a step, a hold, a commit, a controlled value — goes through one
 * reconcile: snapped to the step, held inside `[min, max]`, rounded to the
 * precision. `onValueChange` fires only when that changes the value.
 *
 * The box is `Input.Group`'s, so it is identical to an `Input` beside it, and
 * an enclosing `Field` sets its invalid and disabled state and its label.
 *
 * @example
 * <Field>
 *   <Field.Label>Guests</Field.Label>
 *   <NumberInput defaultValue={2} max={10} min={1} />
 *   <Field.Description>Up to 10 guests.</Field.Description>
 * </Field>
 *
 * @example
 * <NumberInput defaultValue={19.5} formatOptions={{ currency: "NZD", style: "currency" }} step={0.5} />
 *
 * @example
 * <NumberInput size="lg">
 *   <NumberInput.Field />
 *   <NumberInput.Decrement position="end" />
 *   <NumberInput.Increment />
 * </NumberInput>
 */
export const NumberInput = Object.assign(NumberInputRoot, {
	/** The editable number. Formatted at rest, the bare number while focused. */
	Field: NumberInputField,
	/** The minus button. Tap to step, hold to repeat. Disabled at the min. */
	Decrement: NumberInputDecrement,
	/** The plus button. Tap to step, hold to repeat. Disabled at the max. */
	Increment: NumberInputIncrement,
	displayName: "DelacourUI.NumberInput",
});
