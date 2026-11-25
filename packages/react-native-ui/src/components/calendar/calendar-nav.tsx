import type { ReactElement } from "react";
import { useMinimumHitTarget, useThemeLength } from "../../hooks/use-minimum-hit-target";
import { IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { BUTTON_HEIGHTS, buttonHeightVariable } from "../button/button.variants";
import { useDirection } from "../direction/direction.context";
import { Icon } from "../icon";
import { useCalendarPart } from "./calendar.context";
import { resolveCalendarNavHitSlop, resolvePartTestID } from "./calendar.variants";

export type CalendarNavProps = Omit<ButtonProps, "children" | "onPress"> & {
	/** Which way the arrow pages. */
	direction: "prev" | "next";
	/** The arrow's accessible name. Defaults to `labels` (English: "Previous month" / "Next month" — or year, in the months view). */
	label?: string;
};

/**
 * One paging arrow: a ghost icon button that disables itself at the bound it points at.
 *
 * In the month grid it pages a month; in the months view, a year; in the years view, where the
 * list scrolls instead, it is disabled. A disabled calendar disables it too — a read-only one
 * does not, because looking at another month changes nothing.
 *
 * Its slop is the theme's `icon-sm` edge grown to the minimum, except on the side facing the
 * caption, which is held to half the header gap so it never takes a press meant for it. A caller's `hitSlop`
 * wins.
 */
export function CalendarNav({ direction, label, isDisabled, hitSlop, ...props }: CalendarNavProps): ReactElement {
	const {
		canGoNext,
		canGoPrev,
		goNext,
		goPrev,
		isDisabled: calendarDisabled,
		labels,
		testID,
		view,
	} = useCalendarPart("Calendar.Nav");
	const isPrev = direction === "prev";
	const canGo = (isPrev ? canGoPrev : canGoNext) && view !== "years";
	const name =
		view === "months"
			? isPrev
				? labels.previousYear
				: labels.nextYear
			: isPrev
				? labels.previousMonth
				: labels.nextMonth;

	const height = useThemeLength(buttonHeightVariable("icon-sm"), BUTTON_HEIGHTS.sm);
	const { isRTL } = useDirection();
	const minimumHitSlop = resolveCalendarNavHitSlop(height, useMinimumHitTarget(), {
		direction: isPrev ? "prev" : "next",
		isRTL,
	});

	return (
		<Button
			accessibilityLabel={label ?? name}
			hitSlop={hitSlop ?? minimumHitSlop}
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
