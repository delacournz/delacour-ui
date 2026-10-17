import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useDatePickerPart } from "./date-picker.context";
import { datePickerVariants } from "./date-picker.variants";

export type DatePickerValueProps = Omit<TextPresetProps, "children">;

/**
 * The trigger's text: the selection, formatted, or the placeholder in the muted tone.
 *
 * A half-picked range reads "5 Oct 2026 –" with "End" after it in the placeholder's tone, so the
 * missing end is shown as missing rather than as a dangling dash.
 */
export function DatePickerValue({ className, ...props }: DatePickerValueProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Value");
	const slots = datePickerVariants({ isPlaceholder: picker.display === undefined, size: picker.size });
	const isHalfRange = picker.shown.mode === "range" && picker.shown.value.start !== null && !picker.shown.value.end;

	return (
		<Text className={slots.value({ className })} numberOfLines={1} {...props}>
			{picker.display ?? picker.placeholder}
			{isHalfRange ? <Text className={slots.valuePlaceholder()}> End</Text> : null}
		</Text>
	);
}
DatePickerValue.displayName = "DelacourUI.DatePicker.Value";
