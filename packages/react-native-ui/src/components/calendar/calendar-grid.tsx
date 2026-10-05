import { type ReactElement, type ReactNode, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { playHaptic } from "../pressable";
import { useCalendarPart } from "./calendar.context";
import { type CalendarCell, formatMonthYear, monthGrid, serialiseDate } from "./calendar.date";
import { calendarVariants, resolvePageDirection } from "./calendar.variants";
import { CalendarDay } from "./calendar-day";
import { CalendarPicker } from "./calendar-picker";

export type CalendarGridProps = Omit<ViewProps, "children"> & {
	className?: string;
	/** Draws one cell. Omitted, a `Calendar.Day` for its date. */
	renderDay?: (cell: CalendarCell) => ReactNode;
};

/** How far a sideways drag travels before the grid claims it, and a vertical one before it gives up. */
const PAN_ACTIVATE_X = 12;
const PAN_FAIL_Y = 12;

/** How far a drag past a bound still follows the finger, as a fraction — enough to feel the edge. */
const BOUND_RESISTANCE = 0.2;

const SLIDE = { duration: 200, easing: Easing.out(Easing.cubic) } as const;
const SETTLE_SPRING = { damping: 20, stiffness: 260 } as const;

/**
 * The six weeks of the visible month, and the surface a swipe pages on.
 *
 * **Paging is a slide out and a slide in.** A released swipe slides the old month off the side it
 * was dragged towards, the month changes, and the new one slides in from the other side — the
 * same entrance the arrows give it. Both off-screen positions are clipped, so the frame where the
 * month swaps is never seen. With calm motion on, both slides are skipped and the page simply
 * swaps; the page change itself is behaviour, not decoration, and always happens.
 *
 * **A drag towards a bound resists** rather than moving freely, then settles back with a light
 * impact haptic — the edge is felt instead of the month silently refusing to turn.
 *
 * **The grid claims a sideways drag and gives up a vertical one**, so it lives inside a scrolling
 * screen or a sheet without stealing the scroll.
 *
 * It also hosts `Calendar.Picker` over itself while a jump view is open, and hides its weeks
 * rather than unmounting them, so the calendar's height never moves.
 */
export function CalendarGrid({ className, renderDay, ...props }: CalendarGridProps): ReactElement {
	const calendar = useCalendarPart("Calendar.Grid");
	const {
		canGoNext,
		canGoPrev,
		goNext,
		goPrev,
		isDisabled,
		label,
		locale,
		pageDirection,
		size,
		swipeToPage,
		variant,
		view,
	} = calendar;
	const { visibleMonth, weekStartsOn } = calendar;
	const slots = calendarVariants({ size, variant });
	const isCalm = useCalmMotion();

	const width = useSharedValue(0);
	const translateX = useSharedValue(0);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
		},
		[width]
	);

	const page = useCallback((direction: -1 | 1) => (direction === 1 ? goNext() : goPrev()), [goNext, goPrev]);

	const pan = useMemo(
		() =>
			Gesture.Pan()
				.enabled(swipeToPage && view === "days" && !isDisabled)
				.activeOffsetX([-PAN_ACTIVATE_X, PAN_ACTIVATE_X])
				.failOffsetY([-PAN_FAIL_Y, PAN_FAIL_Y])
				.onUpdate((event) => {
					"worklet";
					const blocked = (event.translationX > 0 && !canGoPrev) || (event.translationX < 0 && !canGoNext);
					translateX.value = blocked ? event.translationX * BOUND_RESISTANCE : event.translationX;
				})
				.onEnd((event) => {
					"worklet";
					const direction = resolvePageDirection({
						canGoNext,
						canGoPrev,
						translationX: event.translationX,
						velocityX: event.velocityX,
						width: width.value,
					});

					if (direction === 0) {
						const blocked = (event.translationX > 0 && !canGoPrev) || (event.translationX < 0 && !canGoNext);
						if (blocked) playHaptic("light");
						translateX.value = withSpring(0, SETTLE_SPRING);
						return;
					}

					playHaptic("selection");
					if (isCalm) {
						translateX.value = 0;
						scheduleOnRN(page, direction);
						return;
					}
					translateX.value = withTiming(-direction * width.value, SLIDE, (finished) => {
						"worklet";
						if (finished) scheduleOnRN(page, direction);
					});
				})
				.onFinalize((_event, success) => {
					"worklet";
					if (!success) translateX.value = withSpring(0, SETTLE_SPRING);
				}),
		[canGoNext, canGoPrev, isCalm, isDisabled, page, swipeToPage, translateX, view, width]
	);

	// The new month slides in from the side the old one left by. Skipped on the first render — a
	// calendar does not animate onto the screen — and for a jump, which has no side.
	const monthKey = serialiseDate(visibleMonth);
	const previousKey = useRef(monthKey);
	useLayoutEffect(() => {
		if (previousKey.current === monthKey) return;
		previousKey.current = monthKey;
		if (isCalm || pageDirection === 0 || width.value <= 0) {
			translateX.value = 0;
			return;
		}
		translateX.value = withSequence(withTiming(pageDirection * width.value, { duration: 0 }), withTiming(0, SLIDE));
	}, [isCalm, monthKey, pageDirection, translateX, width]);

	const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

	const weeks = useMemo(() => monthGrid(visibleMonth, weekStartsOn), [visibleMonth, weekStartsOn]);
	const isPicking = view !== "days";

	return (
		<View className={slots.grid({ className })} onLayout={handleLayout} {...props}>
			<GestureDetector gesture={pan}>
				<Animated.View
					accessibilityElementsHidden={isPicking}
					accessibilityLabel={label ?? formatMonthYear(visibleMonth, locale)}
					role="grid"
					className={isPicking ? "opacity-0" : undefined}
					importantForAccessibility={isPicking ? "no-hide-descendants" : "auto"}
					pointerEvents={isPicking ? "none" : "auto"}
					style={slideStyle}
				>
					{weeks.map((week) => (
						<View className={slots.week()} key={serialiseDate(week[0]?.date ?? visibleMonth)}>
							{week.map((cell) =>
								renderDay ? (
									<View className="flex-1" key={serialiseDate(cell.date)}>
										{renderDay(cell)}
									</View>
								) : (
									<CalendarDay date={cell.date} key={serialiseDate(cell.date)} />
								)
							)}
						</View>
					))}
				</Animated.View>
			</GestureDetector>
			{isPicking ? <CalendarPicker /> : null}
		</View>
	);
}
CalendarGrid.displayName = "DelacourUI.Calendar.Grid";
