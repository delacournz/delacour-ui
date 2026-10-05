import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Button, type ButtonProps } from "../button";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDateTimePickerPart } from "./date-time-picker.context";

export type DateTimePickerDoneProps = Omit<ButtonProps, "onPress">;

/**
 * Closes the sheet, announcing the composed value. Every pick has already been committed, so Done
 * decides nothing — it is the one way out that says what was chosen.
 */
export function DateTimePickerDone({
	children,
	className,
	variant = "primary",
	testID,
	...props
}: DateTimePickerDoneProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Done");

	return (
		<Button
			className={cn("flex-1", className)}
			onPress={picker.done}
			testID={testID ?? resolvePartTestID(picker.testID, "done")}
			variant={variant}
			{...props}
		>
			{children ?? <Button.Label>{picker.doneLabel}</Button.Label>}
		</Button>
	);
}
DateTimePickerDone.displayName = "DelacourUI.DateTimePicker.Done";
