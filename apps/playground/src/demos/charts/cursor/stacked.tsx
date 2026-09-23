import {
	CartesianChart,
	ChartArea,
	ChartCursorDot,
	ChartCursorLine,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useChartScrub,
	useSystemFont,
} from "@delacour/react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrubbing a stack",
	caption:
		"For a key in `stackKeys` the dot rides the top of that series' band, where the eye expects it, while `series[key].value` keeps the raw measurement a label would print.",
	capture: { align: "stretch", flow: "charts/cursor/stacked" },
};

const DATA = [
	{ month: "Jan", web: 120, ios: 60, android: 30 },
	{ month: "Feb", web: 150, ios: 90, android: 45 },
	{ month: "Mar", web: 130, ios: 70, android: 55 },
	{ month: "Apr", web: 180, ios: 110, android: 40 },
	{ month: "May", web: 170, ios: 95, android: 65 },
	{ month: "Jun", web: 210, ios: 120, android: 70 },
];

const KEYS = ["web", "ios", "android"] as const;

const COLORS: Record<(typeof KEYS)[number], string> = {
	web: "#0A84FF",
	ios: "#30D158",
	android: "#FF9F0A",
};

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const scrub = useChartScrub(KEYS);

	return (
		<View style={styles.chart} testID="charts-scrub-stacked">
			<CartesianChart data={DATA} font={font} scrub={scrub} stackKeys={KEYS} xKey="month" yKeys={KEYS}>
				{({ stacked }) => (
					<>
						<ChartGrid color="#8E8E9340" />
						<ChartYAxis color="#8E8E93" />
						<ChartXAxis color="#8E8E93" />
						{KEYS.map((key) => (
							<ChartArea color={`${COLORS[key]}99`} key={key} segments={stacked[key]} />
						))}
						<ChartCursorLine axis="x" color="#8E8E93" dash={[4, 4]} />
						{KEYS.map((key) => (
							<ChartCursorDot borderColor="#FFFFFF" color={COLORS[key]} key={key} radius={5} yKey={key} />
						))}
					</>
				)}
			</CartesianChart>
		</View>
	);
}
