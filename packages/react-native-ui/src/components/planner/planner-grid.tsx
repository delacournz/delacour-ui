import { type ReactElement, useEffect, useMemo } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { cn } from "../../lib/cn";
import { usePlannerPart } from "./planner.context";
import type { PlannerDayRenderer } from "./planner.types";
import { PLANNER_PAGE_DURATION, plannerVariants, resolveSwipePage } from "./planner.variants";
import { buildMonthGrid, toDayKey } from "./planner-dates";
import { PlannerDay } from "./planner-day";
import { PlannerWeekdays } from "./planner-weekdays";

export type PlannerGridProps = ViewProps & {
	className?: string;
	/** Draws each day's content in place of the variant's. */
	renderDay?: PlannerDayRenderer;
	/** Turn the horizontal swipe off — for a grid inside a horizontal pager. Defaults to `true`. */
	isSwipeEnabled?: boolean;
};

/** Mid-ease, so a slide lands softly rather than stopping dead. */
const PAGE_EASING = Easing.out(Easing.cubic);
/** The crossfade that replaces the slide under reduce motion. */
const FADE_DURATION = 150;

/**
 * The month as six weeks of seven days, under a row of weekday names.
 *
 * Always six weeks, so paging between a four-week February and a six-week
 * month never moves anything below it. A horizontal swipe pages a month — the
 * pan only claims a finger that has travelled 20pt sideways, and lets go of one
 * that moves vertically first, so a scroll view around the planner keeps its
 * scroll and a tap on a day is still a tap. The new month slides in from the
 * side it was asked for over 220 ms, or crossfades under reduce motion.
 *
 * With a `testID`, each day takes `${testID}-${YYYY-MM-DD}`.
 */
export function PlannerGrid({
	className,
	renderDay,
	isSwipeEnabled = true,
	testID,
	onLayout,
	...props
}: PlannerGridProps): ReactElement {
	const { month, weekStartsOn, page, pendingRef, fill, variant, isFramed } = usePlannerPart("Planner.Grid");
	const reduceMotion = useReducedMotion();
	const monthKey = toDayKey(month);
	const slots = plannerVariants({ fill, isFramed, variant });

	const weeks = useMemo(() => {
		const days = buildMonthGrid(month, weekStartsOn);
		return Array.from({ length: 6 }, (_, row) => days.slice(row * 7, row * 7 + 7));
	}, [month, weekStartsOn]);

	const width = useSharedValue(0);
	const translateX = useSharedValue(0);
	const opacity = useSharedValue(1);

	// Runs before the root's effect clears the request, so the direction is still there to read.
	useEffect(() => {
		const pending = pendingRef.current;
		if (pending === null || pending.key !== monthKey || pending.direction === 0) return;
		if (reduceMotion) {
			translateX.value = 0;
			opacity.value = 0;
			opacity.value = withTiming(1, { duration: FADE_DURATION });
			return;
		}
		translateX.value = pending.direction * width.value;
		translateX.value = withTiming(0, { duration: PLANNER_PAGE_DURATION, easing: PAGE_EASING });
	}, [monthKey, opacity, pendingRef, reduceMotion, translateX, width]);

	const gesture = useMemo(() => {
		const release = (translation: number, velocity: number, span: number): void => {
			const direction = resolveSwipePage(translation, velocity, span);
			if (direction !== 0) page(direction, "swipe");
		};

		return Gesture.Pan()
			.enabled(isSwipeEnabled)
			.activeOffsetX([-20, 20])
			.failOffsetY([-12, 12])
			.onUpdate((event) => {
				"worklet";
				if (!reduceMotion) translateX.value = event.translationX;
			})
			.onEnd((event) => {
				"worklet";
				// Settle back regardless: an accepted month replaces this with its own
				// slide, and a refused one must not leave the grid half off-screen.
				translateX.value = withTiming(0, { duration: PLANNER_PAGE_DURATION, easing: PAGE_EASING });
				scheduleOnRN(release, event.translationX, event.velocityX, width.value);
			});
	}, [isSwipeEnabled, page, reduceMotion, translateX, width]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateX: translateX.value }],
	}));

	const handleLayout = (event: LayoutChangeEvent): void => {
		width.value = event.nativeEvent.layout.width;
		onLayout?.(event);
	};

	return (
		<View className={cn(fill ? "flex-1" : undefined, "gap-1")}>
			<PlannerWeekdays />
			<GestureDetector gesture={gesture}>
				<View className={slots.grid({ className })} onLayout={handleLayout} testID={testID} {...props}>
					<Animated.View className={fill ? "flex-1" : undefined} style={animatedStyle}>
						{weeks.map((week) => (
							<View className={slots.week()} key={week[0]?.key}>
								{week.map((day) => (
									<PlannerDay
										date={day.date}
										isInMonth={day.isInMonth}
										key={day.key}
										renderDay={renderDay}
										testID={testID === undefined ? undefined : `${testID}-${day.key}`}
									/>
								))}
							</View>
						))}
					</Animated.View>
				</View>
			</GestureDetector>
		</View>
	);
}
PlannerGrid.displayName = "DelacourUI.Planner.Grid";
