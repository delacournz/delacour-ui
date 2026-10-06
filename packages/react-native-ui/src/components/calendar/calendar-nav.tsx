import type { ReactElement } from "react";
import { IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { Icon } from "../icon";
import { useCalendarPart } from "./calendar.context";
import { resolvePartTestID } from "./calendar.variants";

export type CalendarNavProps = Omit<ButtonProps, "children" | "onPress"> & {
	/** Which way the arrow pages. */
	direction: "prev" | "next";
	/** The arrow's accessible name. Defaults to "Previous month" / "Next month" — or year, in the months view. */
	label?: string;
};

/**
 * One paging arrow: a ghost icon button that disables itself at the bound it points at.
 *
 * In the month grid it pages a month; in the months view, a year; in the years view, where the
 * list scrolls instead, it is disabled. A disabled calendar disables it too — a read-only one
 * does not, because looking at another month changes nothing.
 */
export function CalendarNav({ direction, label, isDisabled, ...props }: CalendarNavProps): ReactElement {
	const {
		canGoNext,
		canGoPrev,
		goNext,
		goPrev,
		isDisabled: calendarDisabled,
		testID,
		view,
	} = useCalendarPart("Calendar.Nav");
	const isPrev = direction === "prev";
	const canGo = (isPrev ? canGoPrev : canGoNext) && view !== "years";
	const unit = view === "months" ? "year" : "month";

	return (
		<Button
			accessibilityLabel={label ?? `${isPrev ? "Previous" : "Next"} ${unit}`}
			haptic="selection"
			isDisabled={isDisabled ?? (calendarDisabled || !canGo)}
			onPress={isPrev ? goPrev : goNext}
			size="icon-sm"
			testID={resolvePartTestID(testID, direction)}
			variant="ghost"
			{...props}
		>
			<Icon icon={isPrev ? IconChevronLeft : IconChevronRight} />
		</Button>
	);
}
CalendarNav.displayName = "DelacourUI.Calendar.Nav";
