import type { ReactElement } from "react";
import { useTimePickerPart } from "./time-picker.context";
import { TimePickerWheel } from "./time-picker-wheel";

export type TimePickerWheelSlotProps = {
	className?: string;
	testID?: string;
};

/**
 * The wheel, wired to the enclosing picker: it shows the picker's value — or,
 * while that is `null`, the time the sheet opened on — and commits each settle
 * to it. Every option the root took (bounds, step, seconds, clock, locale,
 * size) arrives through context.
 *
 * @example
 * <TimePicker.Content>
 *   <TimePicker.Wheel />
 * </TimePicker.Content>
 */
export function TimePickerWheelSlot({ className, testID }: TimePickerWheelSlotProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Wheel");

	return (
		<TimePickerWheel
			{...picker.wheel}
			className={className}
			hourCycle={picker.hourCycle}
			isDisabled={picker.isDisabled}
			locale={picker.locale}
			onValueChange={picker.setValue}
			size={picker.size}
			testID={testID}
			value={picker.value ?? picker.wheelTime}
		/>
	);
}
TimePickerWheelSlot.displayName = "DelacourUI.TimePicker.Wheel";
