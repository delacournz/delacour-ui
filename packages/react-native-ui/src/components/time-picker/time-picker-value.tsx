import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useTimePickerPart } from "./time-picker.context";
import { timePickerVariants } from "./time-picker.variants";

export type TimePickerValueProps = Omit<TextPresetProps, "children"> & {
	/** Overrides the picker's own placeholder for this trigger. */
	placeholder?: string;
};

/**
 * The trigger's text: the formatted time, or the placeholder in the muted
 * colour while none is set. Sized on `text-input-*`, the same token as a text
 * field's value, so the two read as one type scale.
 *
 * @example
 * <TimePicker.Value placeholder="Reminder" />
 */
export function TimePickerValue({ placeholder, className, ...props }: TimePickerValueProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Value");
	const isPlaceholder = picker.display === "";

	return (
		<Text
			className={timePickerVariants({ size: picker.size, isPlaceholder }).value({ className })}
			numberOfLines={1}
			{...props}
		>
			{isPlaceholder ? (placeholder ?? picker.placeholder) : picker.display}
		</Text>
	);
}
TimePickerValue.displayName = "DelacourUI.TimePicker.Value";
