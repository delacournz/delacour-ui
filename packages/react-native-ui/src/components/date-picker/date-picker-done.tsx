import type { ReactElement } from "react";
import { cn } from "../../lib/cn";
import { Button, type ButtonProps } from "../button";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDatePickerPart } from "./date-picker.context";

export type DatePickerDoneProps = Omit<ButtonProps, "onPress">;

/** Closes the sheet. A half-picked range is discarded; everything else is already committed. */
export function DatePickerDone({
	children,
	className,
	testID,
	variant = "primary",
	...props
}: DatePickerDoneProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Done");

	return (
		<Button
			className={cn("flex-1", className)}
			onPress={picker.close}
			testID={testID ?? resolvePartTestID(picker.testID, "done")}
			variant={variant}
			{...props}
		>
			{children ?? <Button.Label>{picker.doneLabel}</Button.Label>}
		</Button>
	);
}
DatePickerDone.displayName = "DelacourUI.DatePicker.Done";
