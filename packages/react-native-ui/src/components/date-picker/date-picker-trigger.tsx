import type { ReactElement } from "react";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { Pressable, type PressableProps } from "../pressable";
import { useDatePickerPart } from "./date-picker.context";
import { resolveDatePickerTriggerClass, resolveTriggerState } from "./date-picker.variants";
import { DatePickerIcon } from "./date-picker-icon";
import { DatePickerValue } from "./date-picker-value";

export type DatePickerTriggerProps = Omit<PressableProps, "asChild" | "busy" | "disabled" | "onPress">;

/**
 * The field-shaped control that opens the sheet.
 *
 * Wears the `Input` box itself — `inputVariants`' root slot, read rather than restated — so it
 * lines up with a text field beside it at every size and variant. Open is its focus state, and
 * invalid outranks it the way it does on a field. Disabled and read-only never open.
 *
 * Only disabled reads as disabled. Read-only shows its value at full strength, so a screen reader
 * reads it as enabled — but it gets no press feedback, no press handler and no "Opens calendar"
 * hint, because it cannot open. It reads as text, not a button: a button that does nothing on a
 * double-tap is a dead control. Disabled keeps the button role, so it reads as a dimmed button.
 *
 * Omitted children are `DatePicker.Value` then `DatePicker.Icon`.
 */
export function DatePickerTrigger({
	accessibilityHint = "Opens calendar",
	children,
	className,
	feedback = "fade",
	testID,
	...props
}: DatePickerTriggerProps): ReactElement | null {
	const picker = useDatePickerPart("DatePicker.Trigger");
	const state = resolveTriggerState(picker);

	if (picker.presentation === "inline") return null;

	return (
		<Pressable
			accessibilityHint={state.canOpen ? accessibilityHint : undefined}
			accessibilityLabel={picker.accessibilityLabel}
			accessibilityRole={state.canOpen || state.isDisabled ? "button" : "text"}
			accessibilityState={{ disabled: state.isDisabled, expanded: picker.isOpen }}
			accessibilityValue={{ text: picker.accessibilityValue }}
			className={resolveDatePickerTriggerClass({
				className,
				isDisabled: state.isDisabled,
				isFocused: state.isFocused,
				isInvalid: state.isInvalid,
				size: picker.size,
				variant: picker.variant,
			})}
			disabled={state.isDisabled}
			feedback={state.canOpen ? feedback : "none"}
			onPress={state.canOpen ? picker.open : undefined}
			testID={testID ?? resolvePartTestID(picker.testID, "trigger")}
			{...props}
		>
			{children ?? (
				<>
					<DatePickerValue />
					<DatePickerIcon />
				</>
			)}
		</Pressable>
	);
}
DatePickerTrigger.displayName = "DelacourUI.DatePicker.Trigger";
