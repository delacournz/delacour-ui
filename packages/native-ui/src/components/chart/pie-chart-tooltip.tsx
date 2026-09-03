import { sliceLabelPosition } from "delacour-react-native-charts/core";
import { type ReactElement, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { chartTooltipOffset, formatPieValue, pieSlicePercent } from "./chart.variants";
import { usePieChart } from "./pie-chart.context";

export type PieChartTooltipProps = {
	className?: string;
	/** Prints the selected slice's value. Defaults to digits grouped in threes, `1,240`. */
	formatValue?: (value: number, name: string) => string;
	/** Prints the selected slice's share. Defaults to a whole-number percentage. */
	formatPercent?: (percent: number) => string;
	/** Overrides the measured size used to keep the tooltip inside the frame. */
	size?: { width: number; height: number };
};

/** Assumed size before layout, so the first frame is not placed off-screen. */
const DEFAULT_SIZE = { width: 120, height: 48 };

/**
 * A readout for the selected slice: its label, its value and its share.
 *
 * Selection-driven, not scrub-driven. A pie has no x to scrub along, so the
 * readout answers a tap rather than following a finger — which is also why it
 * needs no shared values and no `useAnimatedStyle`: it moves when the
 * selection changes, a few times a session, not once a frame.
 *
 * It sits just outside the slice's outer edge on its bisector, the position a
 * callout line would point at, and `chartTooltipOffset` keeps it inside the
 * frame the same way the cartesian tooltip is kept. Hidden while nothing is
 * selected; a tap outside every slice clears the selection and hides it.
 */
export function PieChartTooltip({
	className,
	formatValue,
	formatPercent,
	size,
}: PieChartTooltipProps): ReactElement | null {
	const { series, values, total, slices, slots, frame, selectedIndex } = usePieChart();
	const [measured, setMeasured] = useState(DEFAULT_SIZE);
	const box = size ?? measured;

	const onLayout = (event: LayoutChangeEvent): void => {
		const { width, height } = event.nativeEvent.layout;
		setMeasured((current) => (current.width === width && current.height === height ? current : { width, height }));
	};

	if (selectedIndex === null) return null;
	const entry = series[selectedIndex];
	const slice = slices[selectedIndex];
	const value = values[selectedIndex];
	if (entry === undefined || slice === undefined || value === undefined) return null;

	const anchor = sliceLabelPosition(slice, 1.05);
	const offset = chartTooltipOffset({
		x: anchor.x,
		y: anchor.y,
		width: box.width,
		height: box.height,
		frameWidth: frame.width,
		frameHeight: frame.height,
	});
	const percent = pieSlicePercent(value, total);

	return (
		<View
			className={cn(slots.tooltip(), className)}
			onLayout={onLayout}
			pointerEvents="none"
			style={{ transform: [{ translateX: offset.x }, { translateY: offset.y }] }}
		>
			<View className={slots.tooltipRow()}>
				<View className={slots.tooltipSwatch()} style={{ backgroundColor: entry.color }} />
				<Text className={slots.tooltipName()}>{entry.label}</Text>
				<Text className={slots.tooltipValue()}>{formatValue?.(value, entry.label) ?? formatPieValue(value)}</Text>
			</View>
			<Text className={slots.tooltipHeading()}>{formatPercent?.(percent) ?? `${Math.round(percent)}%`}</Text>
		</View>
	);
}

PieChartTooltip.displayName = "DelacourUI.PieChart.Tooltip";
