import {
	Fragment,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { Platform, TextInput, type TextInputInstance, type TextInputProps, View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import type { InputSize, InputVariant } from "../input/input.variants";
import { type HapticFeedback, playHaptic } from "../pressable";
import { type OtpInputContextValue, OtpInputProvider } from "./otp-input.context";
import {
	buildLayout,
	clampOtpLength,
	type OtpPattern,
	resolveAccessibilityHint,
	resolveAccessibilityLabel,
	resolveAccessibilityValue,
	resolveActiveIndex,
	resolveAutofill,
	resolveKeyboard,
	resolveOtpAxes,
	resolveSlotState,
	resolveUppercase,
	sanitizeOtp,
	shouldFireComplete,
} from "./otp-input.logic";
import { OTP_DEFAULT_SIZE, OTP_DEFAULT_VARIANT, otpInputVariants } from "./otp-input.variants";
import { OtpInputGroup } from "./otp-input-group";
import { OtpInputSeparator } from "./otp-input-separator";
import { OtpInputSlot } from "./otp-input-slot";

/** Read off `TextInputProps` rather than named outright, so a React Native rename cannot go stale. */
type OtpFocusEvent = Parameters<NonNullable<TextInputProps["onFocus"]>>[0];
type OtpBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];
type OtpSubmitEvent = Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0];

/** What a `ref` on an `OtpInput` can do. */
export type OtpInputRef = {
	focus(): void;
	blur(): void;
	/** Empties the code and re-arms `onComplete`. Reports `""` through `onValueChange`. */
	clear(): void;
};

export type OtpInputProps = {
	/** Controlled code. */
	value?: string;
	/** Starting code while uncontrolled. Sanitised like anything typed. */
	defaultValue?: string;
	/** Every change, already sanitised. */
	onValueChange?: (value: string) => void;
	/** Once per transition to a full code — a paste of a whole code fires it once. */
	onComplete?: (value: string) => void;
	/** How many cells. Clamped to 1..12. */
	length?: number;
	/** Which characters a cell takes. A `RegExp` tests one character. */
	pattern?: OtpPattern;
	/** Cells per group, with a separator between groups. `0` or unset draws one group. */
	groupSize?: number;
	/** Uppercase letters as typed. Defaults on for every pattern but `digits`. */
	autoCapitalize?: boolean;
	/** Draws `•` in filled cells. Visual only: autofill and paste still work. */
	isMasked?: boolean;
	/** One character drawn dimmed in each empty cell, such as `"○"` or `"0"`. */
	placeholder?: string;
	autoFocus?: boolean;
	size?: InputSize;
	variant?: InputVariant;
	/** Paints every cell destructive. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Blocks editing and fades the row. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Focusable and readable, but not editable. */
	isReadOnly?: boolean;
	/** Dismisses the keyboard when the code completes. */
	blurOnComplete?: boolean;
	/** Played once when the code completes. `false` silences it. */
	haptic?: false | HapticFeedback;
	onFocus?: (event: OtpFocusEvent) => void;
	onBlur?: (event: OtpBlurEvent) => void;
	onSubmitEditing?: (event: OtpSubmitEvent) => void;
	className?: string;
	/** Falls back to the enclosing `Field.Label`'s text, then "Verification code". */
	accessibilityLabel?: string;
	/** Lands on the hidden `TextInput` — the element a test types into. */
	testID?: string;
	/** A custom anatomy of `OtpInput.Group`, `OtpInput.Slot` and `OtpInput.Separator`. */
	children?: ReactNode;
	ref?: Ref<OtpInputRef>;
};

function OtpInputRoot({
	value,
	defaultValue = "",
	onValueChange,
	onComplete,
	length,
	pattern = "digits",
	groupSize,
	autoCapitalize,
	isMasked = false,
	placeholder,
	autoFocus,
	size = OTP_DEFAULT_SIZE,
	variant = OTP_DEFAULT_VARIANT,
	isInvalid,
	isDisabled,
	isReadOnly = false,
	blurOnComplete = true,
	haptic = "success",
	onFocus,
	onBlur,
	onSubmitEditing,
	className,
	accessibilityLabel,
	testID,
	children,
	ref,
}: OtpInputProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveOtpAxes({ field, own: { isDisabled, isInvalid } });
	const total = clampOtpLength(length);
	const uppercase = resolveUppercase(pattern, autoCapitalize);

	const [initial] = useState(() => sanitizeOtp(defaultValue, { length: total, pattern, uppercase }));
	const [raw, setRaw] = useControllableState<string>({ defaultValue: initial, onChange: onValueChange, value });
	// A controlled value is drawn as it would be stored: a parent passing seven digits to a
	// six-cell field still sees six cells, and the native field is pinned to the same six.
	const code = sanitizeOtp(raw, { length: total, pattern, uppercase });

	const [isFocused, setFocused] = useState(false);
	const inputRef = useRef<TextInputInstance>(null);

	const commit = useCallback(
		(next: string) => {
			if (next === code) return;
			setRaw(next);
			if (!shouldFireComplete(code, next, total)) return;
			if (haptic !== false) playHaptic(haptic);
			if (blurOnComplete) inputRef.current?.blur();
			onComplete?.(next);
		},
		[blurOnComplete, code, haptic, onComplete, setRaw, total]
	);

	const handleChangeText = useCallback(
		(text: string) => commit(sanitizeOtp(text, { length: total, pattern, uppercase })),
		[commit, pattern, total, uppercase]
	);

	const focus = useCallback(() => inputRef.current?.focus(), []);

	useImperativeHandle(
		ref,
		() => ({
			blur: () => inputRef.current?.blur(),
			clear: () => {
				if (code !== "") setRaw("");
			},
			focus,
		}),
		[code, focus, setRaw]
	);

	const registerPress = field?.registerPress;
	useEffect(() => {
		if (!registerPress) return;
		registerPress(focus);
		return () => registerPress(null);
	}, [focus, registerPress]);

	const handleFocus = useCallback(
		(event: OtpFocusEvent) => {
			setFocused(true);
			onFocus?.(event);
		},
		[onFocus]
	);

	const handleBlur = useCallback(
		(event: OtpBlurEvent) => {
			setFocused(false);
			onBlur?.(event);
		},
		[onBlur]
	);

	const context = useMemo<OtpInputContextValue>(
		() => ({
			activeIndex: resolveActiveIndex(Array.from(code).length, total, isFocused),
			isDisabled: axes.isDisabled,
			isFocused,
			isInvalid: axes.isInvalid,
			isMasked,
			length: total,
			placeholder,
			size,
			slot: (index: number) => resolveSlotState(code, index, { isFocused, length: total }),
			value: code,
			variant,
		}),
		[axes.isDisabled, axes.isInvalid, code, isFocused, isMasked, placeholder, size, total, variant]
	);

	const slots = otpInputVariants({ isDisabled: axes.isDisabled, size });
	const end = code.length;

	// With no children the row is drawn from `length` and `groupSize`: a group per run of cells and
	// a separator between each pair of groups.
	const anatomy =
		children ??
		buildLayout(total, groupSize).map((group, position) => (
			<Fragment key={group[0]}>
				{position > 0 ? <OtpInputSeparator /> : null}
				<OtpInputGroup>
					{group.map((index) => (
						<OtpInputSlot index={index} key={index} />
					))}
				</OtpInputGroup>
			</Fragment>
		));

	// The visible row is drawing only — no touch, nothing for a screen reader to walk — and the
	// one `TextInput` laid over it is the control: what takes the tap, the keyboard, the paste, the
	// autofill and the accessible name. Its text, caret and selection are transparent; see
	// AGENTS.md for why it is not `opacity: 0` and why masking is not `secureTextEntry`.
	return (
		<OtpInputProvider value={context}>
			<View className={slots.root({ className })}>
				<View
					accessibilityElementsHidden
					accessible={false}
					className={slots.row()}
					importantForAccessibility="no-hide-descendants"
					pointerEvents="none"
				>
					{anatomy}
				</View>
				<TextInput
					accessibilityHint={resolveAccessibilityHint(total, pattern)}
					accessibilityLabel={resolveAccessibilityLabel(accessibilityLabel, field?.label)}
					accessibilityState={{ disabled: axes.isDisabled }}
					accessibilityValue={{ text: resolveAccessibilityValue({ isMasked, length: total, pattern, value: code }) }}
					autoCapitalize={uppercase ? "characters" : "none"}
					autoComplete={resolveAutofill(Platform.OS)}
					autoCorrect={false}
					autoFocus={autoFocus}
					caretHidden
					className={slots.field()}
					contextMenuHidden={false}
					cursorColor="transparent"
					editable={!axes.isDisabled}
					importantForAutofill="yes"
					keyboardType={resolveKeyboard(pattern)}
					onBlur={handleBlur}
					onChangeText={handleChangeText}
					onFocus={handleFocus}
					onSubmitEditing={onSubmitEditing}
					readOnly={isReadOnly}
					ref={inputRef}
					selection={{ end, start: end }}
					selectionColor="transparent"
					spellCheck={false}
					testID={testID}
					textContentType="oneTimeCode"
					underlineColorAndroid="transparent"
					value={code}
				/>
			</View>
		</OtpInputProvider>
	);
}

/**
 * A one-time code or a PIN: a row of cells driven by a single hidden `TextInput`.
 *
 * **One field, drawn as cells.** There is no input per cell, so nothing juggles focus between them:
 * the system keyboard, a paste, iOS's QuickType suggestion from Messages and Android's SMS autofill
 * all write into one value, which is sanitised — normalised, filtered to `pattern`, cut to `length`
 * — and drawn one character per cell. A tap anywhere on the row focuses it; backspace deletes the
 * last character.
 *
 * **Complete fires on the transition.** `onComplete` runs once when the code reaches `length`,
 * with a `success` haptic and the keyboard dismissed; deleting a character re-arms it. A paste of
 * a whole code is one completion, not six keystrokes.
 *
 * **State works either way from one hook**: pass `value` to control it, or `defaultValue`.
 * `isInvalid` and `isDisabled` cascade in from an enclosing `Field`, whose label also names the
 * field for a screen reader, and a tap on that label focuses it.
 *
 * With no children the row is drawn from `length` and `groupSize`. Write the anatomy out for any
 * other shape.
 *
 * @example
 * <Field isInvalid={isWrong}>
 *   <Field.Label>Verification code</Field.Label>
 *   <OtpInput groupSize={3} onComplete={verify} />
 *   <Field.Error>That code is incorrect</Field.Error>
 * </Field>
 *
 * @example
 * <OtpInput isMasked length={4} size="lg" />
 *
 * @example
 * <OtpInput length={6}>
 *   <OtpInput.Group>
 *     <OtpInput.Slot index={0} />
 *     <OtpInput.Slot index={1} />
 *     <OtpInput.Slot index={2} />
 *   </OtpInput.Group>
 *   <OtpInput.Separator />
 *   <OtpInput.Group>
 *     <OtpInput.Slot index={3} />
 *     <OtpInput.Slot index={4} />
 *     <OtpInput.Slot index={5} />
 *   </OtpInput.Group>
 * </OtpInput>
 */
export const OtpInput = Object.assign(OtpInputRoot, {
	/** A row of cells, at the field's own gap. */
	Group: OtpInputGroup,
	/** One cell — its character, the mask or the placeholder, and the caret while active. */
	Slot: OtpInputSlot,
	/** A short rule between two groups. */
	Separator: OtpInputSeparator,
	displayName: "DelacourUI.OtpInput",
});
