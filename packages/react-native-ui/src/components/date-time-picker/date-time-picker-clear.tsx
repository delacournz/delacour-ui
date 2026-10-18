import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Button, type ButtonProps } from "../button";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDateTimePickerPart } from "./date-time-picker.context";

export type DateTimePickerClearProps = Omit<ButtonProps, "onPress">;

/** Sets the value to `null` and reports it, leaving the sheet open for a fresh pick. Disabled while empty. */
export function DateTimePickerClear({
	children,
	className,
	isDisabled,
	variant = "secondary",
	testID,
	...props
}: DateTimePickerClearProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Clear");

	return (
		<Button
			className={cn("flex-1", className)}
			isDisabled={isDisabled ?? (!picker.hasValue || picker.isDisabled || picker.isReadOnly)}
			onPress={picker.clear}
			testID={testID ?? resolvePartTestID(picker.testID, "clear")}
			variant={variant}
			{...props}
		>
			{children ?? <Button.Label>{picker.clearLabel}</Button.Label>}
		</Button>
	);
}
DateTimePickerClear.displayName = "DelacourUI.DateTimePicker.Clear";
