import {
	CartesianChart,
	ChartCursorDot,
	ChartCursorLine,
	ChartGrid,
	ChartLine,
	ChartXAxis,
	ChartYAxis,
	useChartScrub,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrub",
	caption:
		"`useChartScrub` allocates shared values, the root writes them on the UI thread as a finger drags, and `ChartCursorLine` and `ChartCursorDot` read them. Every field is a number, so a readout on a plain view can read them too.",
	note: "Hold first, then drag. `hold` is the default behaviour because a chart usually lives in a scrolling feed, and a scrub that activated on a plain drag would steal the scroll.",
	capture: { align: "stretch", flow: "charts/cursor/scrub" },
};

const DATA = [
	{ month: "Jan", desktop: 42, mobile: 28 },
	{ month: "Feb", desktop: 58, mobile: 36 },
	{ month: "Mar", desktop: 51, mobile: 44 },
	{ month: "Apr", desktop: 73, mobile: 51 },
	{ month: "May", desktop: 68, mobile: 62 },
	{ month: "Jun", desktop: 91, mobile: 74 },
];

const KEYS = ["desktop", "mobile"] as const;

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const scrub = useChartScrub(KEYS);

	return (
		<View style={styles.chart} testID="charts-scrub">
			<CartesianChart data={DATA} font={font} scrub={scrub} xKey="month" yKeys={KEYS}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartLine color="#0A84FF" yKey="desktop" />
				<ChartLine color="#30D158" yKey="mobile" />
				<ChartCursorLine axis="x" color="#8E8E93" dash={[4, 4]} />
				<ChartCursorDot color="#0A84FF" radius={5} yKey="desktop" />
				<ChartCursorDot color="#30D158" radius={5} yKey="mobile" />
			</CartesianChart>
		</View>
	);
}
