import { type ReactElement, useCallback, useMemo, useRef } from "react";
import { type LayoutChangeEvent, ScrollView, View, type ViewProps } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useCalendarPart } from "./calendar.context";
import { compareMonths, formatYear, monthNames } from "./calendar.date";
import { calendarVariants, isMonthInBounds, resolvePartTestID } from "./calendar.variants";

export type CalendarPickerProps = Omit<ViewProps, "children"> & {
	className?: string;
};

const CROSSFADE_MS = 150;

/**
 * The months and years jump views, laid over the grid while one is open.
 *
 * **Months** is twelve names in a three-column grid: a tap shows that month and returns to the
 * days. **Years** is a scrolling three-column list over the calendar's year span, opened already
 * scrolled to the visible year: a tap returns to the months view in that year, so a birth date
 * is three taps — caption, caption, year — then a month and a day.
 *
 * A month outside the paging bounds is disabled. The view crossfades with the grid it covers,
 * and with calm motion on it simply appears.
 *
 * Rendered by `Calendar.Grid`, which sizes it — it fills the grid's own box, so opening it never
 * changes the calendar's height. Exported for a custom grid that wants to host it itself.
 */
export function CalendarPicker({ className, ...props }: CalendarPickerProps): ReactElement {
	const calendar = useCalendarPart("Calendar.Picker");
	const { goToMonth, isDisabled, locale, monthBounds, setView, size, variant, view, visibleMonth, yearSpan } = calendar;
	const isCalm = useCalmMotion();
	const slots = calendarVariants({ size, variant });

	const names = useMemo(() => monthNames(locale, "short"), [locale]);
	const years = useMemo(() => {
		const list: number[] = [];
		for (let year = yearSpan.from; year <= yearSpan.to; year += 1) list.push(year);
		return list;
	}, [yearSpan.from, yearSpan.to]);

	const scroller = useRef<ScrollView>(null);
	const hasScrolled = useRef(false);
	const handleCurrentLayout = useCallback((event: LayoutChangeEvent) => {
		if (hasScrolled.current) return;
		hasScrolled.current = true;
		scroller.current?.scrollTo({ animated: false, y: event.nativeEvent.layout.y });
	}, []);

	const pickMonth = useCallback(
		(month: number) => {
			goToMonth({ day: 1, month, year: visibleMonth.year });
			setView("days");
		},
		[goToMonth, setView, visibleMonth.year]
	);

	const pickYear = useCallback(
		(year: number) => {
			goToMonth({ day: 1, month: visibleMonth.month, year });
			setView("months");
		},
		[goToMonth, setView, visibleMonth.month]
	);

	const fade = isCalm ? undefined : FadeIn.duration(CROSSFADE_MS);
	const fadeOut = isCalm ? undefined : FadeOut.duration(CROSSFADE_MS);

	return (
		<Animated.View className={cn("absolute inset-0", className)} entering={fade} exiting={fadeOut} {...props}>
			{view === "months" ? (
				<View accessibilityRole="list" className={slots.pickerGrid()}>
					{names.map((name, index) => {
						const month = index + 1;
						const isCurrent = month === visibleMonth.month;
						const inBounds = isMonthInBounds({ day: 1, month, year: visibleMonth.year }, monthBounds);
						const item = calendarVariants({ size, tone: isCurrent ? "selected" : "plain", variant });
						return (
							<Pressable
								accessibilityState={{ selected: isCurrent }}
								className={item.pickerItem({ className: inBounds ? undefined : "opacity-40" })}
								disabled={isDisabled || !inBounds}
								feedback="fade"
								haptic="selection"
								key={name}
								onPress={() => pickMonth(month)}
								testID={resolvePartTestID(calendar.testID, `month-${month}`)}
							>
								<Text className={item.pickerItemLabel()}>{name}</Text>
							</Pressable>
						);
					})}
				</View>
			) : (
				<ScrollView ref={scroller} showsVerticalScrollIndicator={false}>
					<View accessibilityRole="list" className={slots.pickerGrid()}>
						{years.map((year) => {
							const isCurrent = year === visibleMonth.year;
							const item = calendarVariants({ size, tone: isCurrent ? "selected" : "plain", variant });
							const inBounds =
								(!monthBounds.first || compareMonths({ day: 1, month: 12, year }, monthBounds.first) >= 0) &&
								(!monthBounds.last || compareMonths({ day: 1, month: 1, year }, monthBounds.last) <= 0);
							return (
								<Pressable
									accessibilityState={{ selected: isCurrent }}
									className={item.pickerItem({ className: inBounds ? undefined : "opacity-40" })}
									disabled={isDisabled || !inBounds}
									feedback="fade"
									haptic="selection"
									key={year}
									onLayout={isCurrent ? handleCurrentLayout : undefined}
									onPress={() => pickYear(year)}
									testID={resolvePartTestID(calendar.testID, `year-${year}`)}
								>
									<Text className={item.pickerItemLabel()}>{formatYear(year, locale)}</Text>
								</Pressable>
							);
						})}
					</View>
				</ScrollView>
			)}
		</Animated.View>
	);
}
CalendarPicker.displayName = "DelacourUI.Calendar.Picker";
