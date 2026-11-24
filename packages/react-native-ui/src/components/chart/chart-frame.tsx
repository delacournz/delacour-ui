import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import type { AccessibilityActionEvent, LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useChart } from "./chart.context";
import { resolveTooltipRows } from "./chart.variants";
import { resolveChartReadout, resolveChartSummary, stepChartIndex } from "./chart-accessibility";

/** The tooltip's formatters, read off the placed `Chart.Tooltip` at partition time. */
export type ChartFrameTooltip = {
	formatHeading?: (row: Record<string, unknown>, index: number) => string;
	formatValue?: (value: unknown, key: string) => string;
};

export type ChartFrameProps = {
	className: string;
	onLayout: (event: LayoutChangeEvent) => void;
	testID?: string;
	accessible: boolean;
	accessibilityLabel?: string;
	/** `null` when no `Chart.Tooltip` is placed — the frame is then an image, not an adjustable. */
	tooltip: ChartFrameTooltip | null;
	children: ReactNode;
};

/**
 * Module scope, so the array keeps its identity across renders: React Native
 * sends the whole accessibility config across the bridge on any change.
 */
const ADJUSTABLE_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;

/**
 * The chart's frame as one accessibility element.
 *
 * A Skia canvas is opaque, so the frame carries the text alternative: an image
 * with a generated summary, or — when a `Chart.Tooltip` is placed, because the
 * scrub is then something the chart offers — an adjustable a screen reader
 * steps through datum by datum. The canvas and the gesture overlay are not
 * accessible themselves, and an accessible parent groups them on both
 * platforms. `accessible={false}` hides the whole frame, for a caller that
 * supplies its own description (`Kpi.Sparkline`).
 *
 * The index state lives here, in a leaf, so a drag re-renders this frame and
 * not `Chart`'s root.
 */
export function ChartFrame(props: ChartFrameProps): ReactElement {
	const { className, onLayout, testID, accessible, tooltip, children } = props;
	if (!accessible) {
		return (
			<View
				accessibilityElementsHidden
				className={className}
				importantForAccessibility="no-hide-descendants"
				onLayout={onLayout}
				testID={testID}
			>
				{children}
			</View>
		);
	}
	if (tooltip === null) return <ChartImageFrame {...props} />;
	return <ChartAdjustableFrame {...props} tooltip={tooltip} />;
}

/** The summary sentence, from the context the chart already resolved. */
function useChartSummary(override: string | undefined, formatValue: ChartFrameTooltip["formatValue"]): string {
	const { series, data, formatXValue, labels } = useChart();
	return useMemo(
		() =>
			resolveChartSummary({
				kind: "cartesian",
				series,
				data,
				formatX: formatXValue,
				formatValue,
				override,
				labels,
			}),
		[series, data, formatXValue, formatValue, override, labels]
	);
}

function ChartImageFrame({
	className,
	onLayout,
	testID,
	accessibilityLabel,
	tooltip,
	children,
}: ChartFrameProps): ReactElement {
	const label = useChartSummary(accessibilityLabel, tooltip?.formatValue);
	return (
		<View
			accessible
			accessibilityLabel={label}
			accessibilityRole="image"
			className={className}
			onLayout={onLayout}
			testID={testID}
		>
			{children}
		</View>
	);
}

function ChartAdjustableFrame({
	className,
	onLayout,
	testID,
	accessibilityLabel,
	tooltip,
	children,
}: ChartFrameProps & { tooltip: ChartFrameTooltip }): ReactElement {
	const { scrub, series, data, formatXValue, candlestick, candleColors, labels } = useChart();
	const { formatHeading, formatValue } = tooltip;
	const label = useChartSummary(accessibilityLabel, formatValue);
	const [index, setIndex] = useState(-1);

	useAnimatedReaction(
		() => scrub.index.value,
		(next, previous) => {
			// The first run reports the starting -1, which the state already holds. Skipping
			// it keeps a late first run from undoing a step taken before it was delivered.
			if (previous === null || next === previous) return;
			scheduleOnRN(setIndex, next);
		}
	);

	const onAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent): void => {
			const name = event.nativeEvent.actionName;
			if (name !== "increment" && name !== "decrement") return;
			const next = stepChartIndex(index, name === "increment" ? 1 : -1, data.length);
			if (next === -1) return;
			setIndex(next);
			scrub.focus.value = next;
		},
		[index, data.length, scrub]
	);

	const row = data[index];
	const valueText = useMemo(() => {
		if (row === undefined) return undefined;
		const heading = formatHeading?.(row, index) ?? formatXValue(row);
		const rows = resolveTooltipRows(
			series,
			candlestick === null ? null : { keys: candlestick, colors: candleColors },
			row,
			labels
		);
		return resolveChartReadout({ heading, rows, formatValue, labels });
	}, [row, index, formatHeading, formatXValue, series, candlestick, candleColors, formatValue, labels]);

	return (
		<View
			accessible
			accessibilityActions={ADJUSTABLE_ACTIONS}
			accessibilityLabel={label}
			accessibilityRole="adjustable"
			accessibilityValue={valueText === undefined ? undefined : { text: valueText }}
			className={className}
			onAccessibilityAction={onAccessibilityAction}
			onLayout={onLayout}
			testID={testID}
		>
			{children}
		</View>
	);
}

ChartFrame.displayName = "DelacourUI.Chart.Frame";
ChartImageFrame.displayName = "DelacourUI.Chart.ImageFrame";
ChartAdjustableFrame.displayName = "DelacourUI.Chart.AdjustableFrame";
