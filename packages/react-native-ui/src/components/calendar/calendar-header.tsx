import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useCalendarPart } from "./calendar.context";
import { calendarVariants } from "./calendar.variants";
import { CalendarCaption } from "./calendar-caption";
import { CalendarNav } from "./calendar-nav";

export type CalendarHeaderProps = ViewProps & {
	className?: string;
};

/**
 * The row above the grid: the previous arrow, the caption and the next arrow.
 *
 * Omit `children` for that default; pass them to rearrange it — both arrows on one side, say, or
 * a caption with a "Today" button beside it.
 */
export function CalendarHeader({ className, children, ...props }: CalendarHeaderProps): ReactElement {
	const { size, variant } = useCalendarPart("Calendar.Header");
	const slots = calendarVariants({ size, variant });

	return (
		<View className={slots.header({ className })} {...props}>
			{children ?? (
				<>
					<CalendarNav direction="prev" />
					<CalendarCaption />
					<CalendarNav direction="next" />
				</>
			)}
		</View>
	);
}
CalendarHeader.displayName = "DelacourUI.Calendar.Header";
