import { sliceLabelPosition } from "@delacour/react-native-charts/core";
import type { ReactElement } from "react";
import { type AccessibilityActionEvent, Platform, View } from "react-native";
import { dispatchPressableAccessibilityAction, resolvePressableActivation } from "../pressable/pressable.variants";
import { pieSliceAccessibilityLabel } from "./chart-accessibility";
import { usePieChart } from "./pie-chart.context";

export type PieChartSliceTargetsProps = {
	/** The summary the whole pie is announced as. */
	summary: string;
	/** The tooltip's formatters, so a spoken slice reads as the drawn readout does. */
	formatValue?: (value: number, name: string) => string;
	formatPercent?: (percent: number) => string;
};

/** The side of each slice's accessibility box, in points — the minimum touch target. */
const TARGET_SIZE = 44;

/** How far out along a slice's bisector its box is centred, as a fraction of the radius. */
const TARGET_RADIUS_FRACTION = 0.7;

/**
 * The accessibility tree of a selectable pie: its summary, then one element per slice.
 *
 * iOS ignores accessible descendants of an accessible parent, so a selectable
 * pie cannot make its frame one element; the canvas is hidden instead and these
 * boxes stand in for it. They are siblings of the canvas inside the frame, and
 * **never take a touch** (`pointerEvents="none"`): selection by finger stays the
 * engine's hit test, and a screen reader activates a slice through
 * `accessibilityTap` on iOS and the `activate` action on Android, wired by
 * `resolvePressableActivation` as `Pressable` does. Activating a slice selects
 * it; it does not toggle, because "select" is what the user asked for and a
 * second double-tap on the same slice announcing "cleared" would be a surprise.
 *
 * Each box is centred on its slice's label position, so touch exploration lands
 * near the slice it names, and the order is the drawn order.
 */
export function PieChartSliceTargets({ summary, formatValue, formatPercent }: PieChartSliceTargetsProps): ReactElement {
	const { series, values, total, slices, selectedIndex, select } = usePieChart();

	return (
		<>
			<View
				accessibilityLabel={summary}
				accessibilityRole="image"
				accessible
				className="absolute inset-0"
				pointerEvents="none"
			/>
			{series.map((entry, index) => {
				const slice = slices[index];
				if (slice === undefined) return null;
				const anchor = sliceLabelPosition(slice, TARGET_RADIUS_FRACTION);
				const activate = (): void => select(index);
				const activation = resolvePressableActivation({
					hasAccessibilityTap: false,
					hasPress: true,
					platform: Platform.OS,
				});
				return (
					<View
						accessibilityActions={activation.accessibilityActions}
						accessibilityLabel={pieSliceAccessibilityLabel({
							label: entry.label,
							value: values[index] ?? 0,
							total,
							formatValue,
							formatPercent,
						})}
						accessibilityRole="button"
						accessibilityState={{ selected: selectedIndex === index }}
						accessible
						key={entry.key}
						onAccessibilityAction={(event: AccessibilityActionEvent) => {
							dispatchPressableAccessibilityAction({
								actionName: event.nativeEvent.actionName,
								activation,
								busy: false,
								disabled: false,
								onPress: activate,
							});
						}}
						onAccessibilityTap={activation.wiresAccessibilityTap ? activate : undefined}
						pointerEvents="none"
						style={{
							position: "absolute",
							left: anchor.x - TARGET_SIZE / 2,
							top: anchor.y - TARGET_SIZE / 2,
							width: TARGET_SIZE,
							height: TARGET_SIZE,
						}}
					/>
				);
			})}
		</>
	);
}
PieChartSliceTargets.displayName = "DelacourUI.PieChart.SliceTargets";
