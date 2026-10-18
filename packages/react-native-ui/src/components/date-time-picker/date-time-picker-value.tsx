import type { ReactElement } from "react";
import { datePickerVariants } from "../date-picker/date-picker.variants";
import { Text, type TextPresetProps } from "../text";
import { useDateTimePickerPart } from "./date-time-picker.context";

export type DateTimePickerValueProps = Omit<TextPresetProps, "children"> & {
	/** Overrides the root's placeholder for this trigger. */
	placeholder?: string;
};

/** The trigger's text — the date and time, formatted, or the placeholder in the muted tone. */
export function DateTimePickerValue({ className, placeholder, ...props }: DateTimePickerValueProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Value");
	const slots = datePickerVariants({ isPlaceholder: picker.display === undefined, size: picker.size });

	return (
		<Text className={slots.value({ className })} numberOfLines={1} {...props}>
			{picker.display ?? placeholder ?? picker.placeholder}
		</Text>
	);
}
DateTimePickerValue.displayName = "DelacourUI.DateTimePicker.Value";
