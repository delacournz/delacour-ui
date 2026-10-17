import { type ReactElement, useCallback } from "react";
import { Button, type ButtonProps } from "../button";
import { useTimePickerPart } from "./time-picker.context";

export type TimePickerDoneProps = Omit<ButtonProps, "onPress">;

/**
 * Closes the sheet. A wheel nobody touched has committed nothing yet, so Done
 * commits the time it shows; otherwise every settle already did, and Done only
 * closes.
 *
 * @example
 * <TimePicker.Done>
 *   <Button.Label>Save</Button.Label>
 * </TimePicker.Done>
 */
export function TimePickerDone({ children, className, ...props }: TimePickerDoneProps): ReactElement {
	const picker = useTimePickerPart("TimePicker.Done");
	const { close, setValue, value, wheelTime } = picker;

	const handlePress = useCallback(() => {
		if (value === null) setValue(wheelTime);
		close();
	}, [close, setValue, value, wheelTime]);

	return (
		<Button className={className ?? "flex-1"} onPress={handlePress} {...props}>
			{children ?? <Button.Label>{picker.doneLabel}</Button.Label>}
		</Button>
	);
}
TimePickerDone.displayName = "DelacourUI.TimePicker.Done";
