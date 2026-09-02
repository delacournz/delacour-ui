import { type ReactElement, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { useChart } from "./chart.context";
import { chartTooltipOffset } from "./chart.variants";

export type ChartTooltipProps = {
	className?: string;
	/**
	 * Prints the heading from the row under the cursor.
	 *
	 * Defaults to the x field, formatted the way the axis formats it — a `Date`
	 * comes out as `20 Jan`, not as `Tue Jan 20 2026 00:00:00 GMT+0000`.
	 */
	formatHeading?: (row: Record<string, unknown>, index: number) => string;
	/** Prints one series' value. Defaults to the number as written. */
	formatValue?: (value: unknown, key: string) => string;
	/** Overrides the measured size used to keep the tooltip inside the frame. */
	size?: { width: number; height: number };
};

/** Assumed size before layout, so the first frame is not placed off-screen. */
const DEFAULT_SIZE = { width: 120, height: 56 };

/**
 * A floating readout that follows the scrub.
 *
 * **A React Native view, deliberately, even though it sits over the canvas.**
 * It wants `popover`, `border`, the radius scale and the type scale — none of
 * which exist in Skia — and it is the part a caller most wants to restyle,
 * which a className cannot do to a Skia rounded rect. Drawing it in Skia would
 * mean re-implementing text layout and line breaking for nothing.
 *
 * ## Two threads, on purpose
 *
 * Its **position** rides the scrub's shared values through `useAnimatedStyle`,
 * so it tracks the finger on the UI thread with no bridge hop.
 *
 * Its **contents** are ordinary React state, updated through `scheduleOnRN`
 * only when the nearest datum index actually changes. That is a handful of
 * updates per drag rather than one per frame, because the text only changes
 * when the selected row does — and text on a shared value would mean an
 * `AnimatedTextInput` and a `value` prop pretending to be a label.
 */
export function ChartTooltip({ className, formatHeading, formatValue, size }: ChartTooltipProps): ReactElement {
	const { scrub, slots, series, data, formatXValue, frame } = useChart();
	const [index, setIndex] = useState(-1);
	const measured = size ?? DEFAULT_SIZE;

	useAnimatedReaction(
		() => scrub.index.value,
		(next, previous) => {
			if (next === previous) return;
			scheduleOnRN(setIndex, next);
		}
	);

	const style = useAnimatedStyle(() => {
		const offset = chartTooltipOffset({
			x: scrub.x.value,
			y: scrub.series[series[0]?.key ?? ""]?.y.value ?? frame.height / 2,
			width: measured.width,
			height: measured.height,
			frameWidth: frame.width,
			frameHeight: frame.height,
		});

		return {
			opacity: scrub.isActive.value ? 1 : 0,
			transform: [{ translateX: offset.x }, { translateY: offset.y }],
		};
	});

	const row = data[index];
	const heading = row === undefined ? "" : (formatHeading?.(row, index) ?? formatXValue(row));

	return (
		<Animated.View className={cn(slots.tooltip(), className)} pointerEvents="none" style={style}>
			{heading === "" ? null : <Text className={slots.tooltipHeading()}>{heading}</Text>}
			{series.map((entry) => (
				<View className={slots.tooltipRow()} key={entry.key}>
					<View className={slots.tooltipSwatch()} style={{ backgroundColor: entry.color }} />
					<Text className={slots.tooltipName()}>{entry.label}</Text>
					<Text className={slots.tooltipValue()}>
						{row === undefined ? "" : (formatValue?.(row[entry.key], entry.key) ?? String(row[entry.key] ?? ""))}
					</Text>
				</View>
			))}
		</Animated.View>
	);
}

ChartTooltip.displayName = "DelacourUI.Chart.Tooltip";
