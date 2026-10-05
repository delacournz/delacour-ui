import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { BottomSheet } from "../bottom-sheet";
import { resolvePartTestID } from "../calendar/calendar.variants";
import { useDatePickerPart } from "./date-picker.context";
import { datePickerVariants } from "./date-picker.variants";
import { DatePickerCalendar } from "./date-picker-calendar";
import { DatePickerClear } from "./date-picker-clear";
import { DatePickerDone } from "./date-picker-done";

export type DatePickerContentProps = {
	/** The sheet's title. Omitted, the root's `title`. */
	title?: string;
	className?: string;
	/** The sheet's body. Omitted, `DatePicker.Calendar` and the footer. */
	children?: ReactNode;
};

/**
 * Where the calendar is drawn.
 *
 * In a `sheet` picker: a `BottomSheet` portal with a scrim, a close control, the title, the
 * calendar bare on the sheet's surface, and a footer of Clear and Done when the mode wants one —
 * a single day closes on its own, so it gets a footer only when it is clearable. In an `inline`
 * picker: the calendar on a card, in place, with no frame of its own.
 */
export function DatePickerContent({ title, className, children }: DatePickerContentProps): ReactElement {
	const picker = useDatePickerPart("DatePicker.Content");
	const slots = datePickerVariants({ size: picker.size });
	const hasFooter = picker.isClearable || picker.mode !== "single";

	if (picker.presentation === "inline") {
		return <View className={slots.body({ className })}>{children ?? <DatePickerCalendar isBordered />}</View>;
	}

	const footer = hasFooter ? (
		<View className={slots.footer()}>
			{picker.isClearable ? <DatePickerClear /> : null}
			<DatePickerDone />
		</View>
	) : null;

	return (
		<BottomSheet.Portal>
			<BottomSheet.Overlay />
			<BottomSheet.Container>
				<BottomSheet.Content className={className}>
					<BottomSheet.Close testID={resolvePartTestID(picker.testID, "close")} />
					<View className={slots.header()}>
						<BottomSheet.Title testID={resolvePartTestID(picker.testID, "title")}>
							{title ?? picker.title}
						</BottomSheet.Title>
					</View>
					{children ?? (
						<>
							<View className={slots.body()}>
								<DatePickerCalendar />
							</View>
							{footer}
						</>
					)}
				</BottomSheet.Content>
			</BottomSheet.Container>
		</BottomSheet.Portal>
	);
}
DatePickerContent.displayName = "DelacourUI.DatePicker.Content";
