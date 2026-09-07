import {
	CartesianChart,
	ChartArea,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked areas",
	caption:
		"`stackKeys` on the root stacks the series in data space, so the y domain covers the totals. Each `ChartArea` then takes its band from `stacked` and fills from the series below it up to its own top.",
	capture: { align: "stretch" },
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

/** A render prop, because the stacked bands live on the resolved chart and a band is what each area draws. */
export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart data={DATA} font={font} stackKeys={KEYS} xKey="month" yKeys={KEYS}>
				{({ stacked }) => (
					<>
						<ChartGrid color="#8E8E9340" />
						<ChartYAxis color="#8E8E93" />
						<ChartXAxis color="#8E8E93" />
						{KEYS.map((key) => (
							<ChartArea color={`${COLORS[key]}99`} key={key} segments={stacked[key]} />
						))}
					</>
				)}
			</CartesianChart>
		</View>
	);
}
