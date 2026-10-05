import { type ReactElement, useCallback } from "react";
import { type AccessibilityActionEvent, View, type ViewProps } from "react-native";
import { IconChevronDownSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useCalendarPart } from "./calendar.context";
import { formatMonthYear, formatYear } from "./calendar.date";
import { calendarVariants } from "./calendar.variants";

export type CalendarCaptionProps = Omit<ViewProps, "children"> & {
	className?: string;
};

const PAGE_ACTIONS = [
	{ name: "decrement", label: "Previous" },
	{ name: "increment", label: "Next" },
];

/**
 * The month and year above the grid.
 *
 * With `captionLayout="picker"` it is a button: in the grid it opens the months view, in the
 * months view the years view, and in the years view it returns to the grid. With `"label"` it is
 * text.
 *
 * **It is where a screen-reader user pages.** A grid of buttons cannot itself be an adjustable
 * element — iOS and Android both fold an accessible container's children into it, and the days
 * would become unreachable — so the caption carries the increment and decrement actions instead:
 * swipe up or down on "October 2026" to move a month. As a plain label it takes the `adjustable`
 * role outright; as a button the two actions sit beside its activation.
 */
export function CalendarCaption({ className, ...props }: CalendarCaptionProps): ReactElement {
	const {
		canGoNext,
		canGoPrev,
		captionLayout,
		goNext,
		goPrev,
		isDisabled,
		locale,
		setView,
		size,
		variant,
		view,
		visibleMonth,
		yearSpan,
	} = useCalendarPart("Calendar.Caption");
	const slots = calendarVariants({ size, variant });

	const text =
		view === "days"
			? formatMonthYear(visibleMonth, locale)
			: view === "months"
				? formatYear(visibleMonth.year, locale)
				: `${formatYear(yearSpan.from, locale)} – ${formatYear(yearSpan.to, locale)}`;

	const handleAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (event.nativeEvent.actionName === "increment" && canGoNext) goNext();
			if (event.nativeEvent.actionName === "decrement" && canGoPrev) goPrev();
		},
		[canGoNext, canGoPrev, goNext, goPrev]
	);

	const handlePress = useCallback(() => {
		setView(view === "days" ? "months" : view === "months" ? "years" : "days");
	}, [setView, view]);

	const label = <Text className={slots.captionText()}>{text}</Text>;

	if (captionLayout === "label") {
		return (
			<View
				accessibilityActions={PAGE_ACTIONS}
				accessibilityLabel={text}
				accessibilityRole="adjustable"
				accessible
				className={slots.caption({ className })}
				onAccessibilityAction={handleAction}
				{...props}
			>
				{label}
			</View>
		);
	}

	const hint =
		view === "days"
			? "Opens the month and year picker"
			: view === "months"
				? "Opens the year list"
				: "Returns to the month";

	return (
		<Pressable
			accessibilityActions={PAGE_ACTIONS}
			accessibilityHint={hint}
			accessibilityLabel={text}
			className={slots.caption({ className })}
			disabled={isDisabled}
			feedback="fade"
			haptic="selection"
			onAccessibilityAction={handleAction}
			onPress={handlePress}
			{...props}
		>
			{label}
			<Icon color="muted-foreground" icon={IconChevronDownSmall} size="sm" />
		</Pressable>
	);
}
CalendarCaption.displayName = "DelacourUI.Calendar.Caption";
