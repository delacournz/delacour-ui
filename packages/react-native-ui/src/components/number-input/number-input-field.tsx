import { type ReactElement, useCallback } from "react";
import { type AccessibilityActionEvent, type AccessibilityValue, Platform, type TextInputProps } from "react-native";
import { composeRefs } from "../../lib/compose-refs";
import { Input } from "../input/input";
import { useNumberInputPart } from "./number-input.context";
import { resolveNumberInputKeyboard } from "./number-input.format";
import type { NumberInputFieldOwnProps } from "./number-input.types";
import { resolveNumberInputFieldClass } from "./number-input.variants";

type FieldFocusEvent = Parameters<NonNullable<TextInputProps["onFocus"]>>[0];
type FieldBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];
type FieldSubmitEvent = Parameters<NonNullable<TextInputProps["onSubmitEditing"]>>[0];

export type NumberInputFieldProps = NumberInputFieldOwnProps;

const ADJUSTABLE_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;

/**
 * The editable number, between the steppers.
 *
 * At rest it shows the formatted value — grouping, currency, unit. Focused, it
 * shows the bare number and lets the person type anything on the way to one;
 * nothing is committed until blur or submit. See the root for the draft model.
 *
 * It is `adjustable` to a screen reader, with `increment` and `decrement`
 * actions, so a VoiceOver or TalkBack swipe steps the value without finding the
 * buttons. Its props merge over the root's `inputProps`, and both handlers run.
 */
export function NumberInputField({
	className,
	onFocus,
	onBlur,
	onSubmitEditing,
	ref,
	...props
}: NumberInputFieldProps): ReactElement {
	const context = useNumberInputPart("NumberInput.Field");
	const {
		accessibilityLabel,
		accessibilityText,
		config,
		displayText,
		fieldRef,
		inputProps,
		isEditable,
		isReadOnly,
		placeholder,
		stepBy,
		value,
	} = context;
	const shared = { ...inputProps, ...props };

	const handleFocus = useCallback(
		(event: FieldFocusEvent) => {
			context.onFocus();
			inputProps?.onFocus?.(event);
			onFocus?.(event);
		},
		[context.onFocus, inputProps, onFocus]
	);

	const handleBlur = useCallback(
		(event: FieldBlurEvent) => {
			context.onBlur();
			inputProps?.onBlur?.(event);
			onBlur?.(event);
		},
		[context.onBlur, inputProps, onBlur]
	);

	const handleSubmit = useCallback(
		(event: FieldSubmitEvent) => {
			context.onSubmit();
			inputProps?.onSubmitEditing?.(event);
			onSubmitEditing?.(event);
		},
		[context.onSubmit, inputProps, onSubmitEditing]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isReadOnly) return;
			if (event.nativeEvent.actionName === "increment") stepBy(1);
			if (event.nativeEvent.actionName === "decrement") stepBy(-1);
		},
		[isReadOnly, stepBy]
	);

	const accessibilityValue: AccessibilityValue = {
		...(Number.isFinite(config.min) ? { min: config.min } : {}),
		...(Number.isFinite(config.max) ? { max: config.max } : {}),
		...(value === null ? {} : { now: value }),
		...(accessibilityText ? { text: accessibilityText } : {}),
	};

	const keyboard = resolveNumberInputKeyboard({ min: config.min, platform: Platform.OS, precision: config.precision });

	return (
		<Input
			accessibilityActions={ADJUSTABLE_ACTIONS}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="adjustable"
			accessibilityValue={accessibilityValue}
			onAccessibilityAction={handleAccessibilityAction}
			placeholder={placeholder}
			{...keyboard}
			{...shared}
			className={resolveNumberInputFieldClass(className ?? inputProps?.className)}
			editable={isEditable && !isReadOnly}
			onBlur={handleBlur}
			onChangeText={context.onChangeText}
			onFocus={handleFocus}
			onSubmitEditing={handleSubmit}
			ref={composeRefs(fieldRef, inputProps?.ref, ref)}
			value={displayText}
		/>
	);
}
NumberInputField.displayName = "DelacourUI.NumberInput.Field";
