import type { ReactElement, ReactNode } from "react";
import { Pressable, type PressableProps } from "../pressable";
import { useTimePickerPart } from "./time-picker.context";
import { resolveTimePickerTriggerClass } from "./time-picker.variants";
import { TimePickerIcon } from "./time-picker-icon";
import { TimePickerValue } from "./time-picker-value";

export type TimePickerTriggerProps = Omit<PressableProps, "children" | "onPress"> & {
	/** Omit for the value and a clock glyph. */
	children?: ReactNode;
};

/**
 * The field-shaped control that opens the sheet.
 *
 * Draws `Input`'s own box through `resolveTimePickerTriggerClass`, so it lines
 * up with a text field beside it at every size and variant. The box shows
 * `border-ring` for as long as the sheet is open — the picker's focus is the
 * sheet, and the trigger is where it came from.
 *
 * A button to assistive technology: named by the picker's label (or the
 * enclosing `Field.Label`), valued by the formatted time or "not set", and
 * hinted with what a press does. Disabled and read-only both refuse the press;
 * only disabled fades.
 *
 * @example
 * <TimePicker.Trigger>
 *   <TimePicker.Value placeholder="Pick a time" />
 *   <TimePicker.Icon />
 * </TimePicker.Trigger>
 */
export function TimePickerTrigger({ children, className, ...props }: TimePickerTriggerProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Trigger");
	const isInert = picker.isDisabled || picker.isReadOnly;

	return (
		<Pressable
			accessibilityHint={isInert ? undefined : "Opens time picker"}
			accessibilityLabel={picker.accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{ disabled: picker.isDisabled, expanded: picker.isOpen }}
			accessibilityValue={{ text: picker.display || "not set" }}
			className={resolveTimePickerTriggerClass({
				className,
				isDisabled: picker.isDisabled,
				isFocused: picker.isOpen,
				isInvalid: picker.isInvalid,
				size: picker.size,
				variant: picker.variant,
			})}
			disabled={isInert}
			feedback="fade"
			onPress={picker.open}
			{...props}
		>
			{children ?? (
				<>
					<TimePickerValue />
					<TimePickerIcon />
				</>
			)}
		</Pressable>
	);
}
TimePickerTrigger.displayName = "DelacourUI.TimePicker.Trigger";
