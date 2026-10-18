import type { ReactElement } from "react";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { resolveDatePickerTriggerClass, resolveTriggerState } from "../date-picker/date-picker.variants";
import { Pressable, type PressableProps } from "../pressable";
import { useDateTimePickerPart } from "./date-time-picker.context";
import { DateTimePickerIcon } from "./date-time-picker-icon";
import { DateTimePickerValue } from "./date-time-picker-value";

export type DateTimePickerTriggerProps = Omit<PressableProps, "asChild" | "busy" | "disabled" | "onPress">;

/**
 * The field-shaped control that opens the sheet.
 *
 * Wears `DatePicker`'s trigger box — which is `Input`'s, read rather than restated — so a
 * date-and-time field lines up with a date field and a text field beside it at every size and
 * variant. Open is its focus state, and invalid outranks it. Disabled and read-only never open.
 *
 * Omitted children are `DateTimePicker.Value` then `DateTimePicker.Icon`. Renders nothing inline.
 */
export function DateTimePickerTrigger({
	accessibilityHint = "Opens date and time picker",
	children,
	className,
	feedback = "fade",
	testID,
	...props
}: DateTimePickerTriggerProps): ReactElement | null {
	const picker = useDateTimePickerPart("DateTimePicker.Trigger");
	const state = resolveTriggerState(picker);

	if (picker.presentation === "inline") return null;

	return (
		<Pressable
			accessibilityHint={accessibilityHint}
			accessibilityLabel={picker.accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{ disabled: !state.canOpen, expanded: picker.isOpen }}
			accessibilityValue={{ text: picker.accessibilityValue }}
			className={resolveDatePickerTriggerClass({
				className,
				isDisabled: state.isDisabled,
				isFocused: state.isFocused,
				isInvalid: state.isInvalid,
				size: picker.size,
				variant: picker.variant,
			})}
			disabled={!state.canOpen}
			feedback={feedback}
			onPress={picker.open}
			testID={testID ?? resolvePartTestID(picker.testID, "trigger")}
			{...props}
		>
			{children ?? (
				<>
					<DateTimePickerValue />
					<DateTimePickerIcon />
				</>
			)}
		</Pressable>
	);
}
DateTimePickerTrigger.displayName = "DelacourUI.DateTimePicker.Trigger";
