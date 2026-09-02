import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Text } from "../text";
import { usePieChart } from "./pie-chart.context";

export type PieChartCenterProps = {
	/** The headline figure — a total, a percentage. On the type scale, in `foreground`. */
	value?: string;
	/** A caption under the value, in `muted-foreground`. */
	label?: string;
	className?: string;
	/** Anything else to place in the hole, after the value and the label. */
	children?: ReactNode;
};

/**
 * Content in the hole of a donut.
 *
 * A React Native view, not a Skia mark, because what goes in a donut's hole
 * is a headline number and a caption, and those want the type scale, a colour
 * token and a className — none of which exist on a canvas. It is centred over
 * the whole frame, which is where the circle's centre is: the engine centres
 * the largest circle the canvas holds, and this chart gives it no padding.
 *
 * It takes no touches, so a tap through it still lands on a slice.
 */
export function PieChartCenter({ value, label, className, children }: PieChartCenterProps): ReactElement {
	const { slots } = usePieChart();

	return (
		<View className={cn(slots.pieCenter(), className)} pointerEvents="none">
			{value === undefined ? null : <Text className={slots.pieCenterValue()}>{value}</Text>}
			{label === undefined ? null : <Text className={slots.pieCenterLabel()}>{label}</Text>}
			{children}
		</View>
	);
}

PieChartCenter.displayName = "DelacourUI.PieChart.Center";
