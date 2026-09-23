import {
	CartesianChart,
	ChartArea,
	ChartCursorDot,
	ChartCursorLine,
	ChartGrid,
	ChartLine,
	ChartXAxis,
	ChartYAxis,
	useChartScrub,
	useSystemFont,
} from "@delacour/react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dates on the x axis",
	caption:
		"A `Date` field switches the x scale to `time` on its own, and the ticks land on calendar boundaries rather than on even multiples of milliseconds. Hold and drag: the scrub finds the nearest day by time, not by index.",
	capture: { align: "stretch", flow: "charts/line/time-series" },
};

const START = new Date(2026, 0, 1).getTime();
const DAY = 86_400_000;

const DATA = Array.from({ length: 30 }, (_, index) => ({
	at: new Date(START + index * DAY),
	price: 100 + Math.round(Math.sin(index / 3) * 18 + index * 1.4),
}));

const KEYS = ["price"] as const;

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const scrub = useChartScrub(KEYS);

	return (
		<View style={styles.chart} testID="charts-time-series">
			<CartesianChart data={DATA} font={font} scrub={scrub} xKey="at" yKeys={KEYS}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartArea color="#0A84FF22" yKey="price" />
				<ChartLine color="#0A84FF" yKey="price" />
				<ChartCursorLine axis="x" color="#8E8E93" dash={[4, 4]} />
				<ChartCursorDot borderColor="#FFFFFF" color="#0A84FF" radius={5} yKey="price" />
			</CartesianChart>
		</View>
	);
}
