import {
	CartesianChart,
	ChartBarStack,
	type ChartBarStackSegmentInfo,
	type ChartBarStackSegmentOptions,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked bars",
	caption:
		"The root stacks and the mark only draws: `stackKeys` names the series so the y domain covers the totals, and `ChartBarStack` reads the segments. `barOptions` rounds the outermost segment of each column and nothing else.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", organic: 120, paid: 60, referral: 30 },
	{ month: "Feb", organic: 150, paid: 90, referral: 45 },
	{ month: "Mar", organic: 130, paid: 70, referral: 55 },
	{ month: "Apr", organic: 180, paid: 110, referral: 40 },
	{ month: "May", organic: 170, paid: 95, referral: 65 },
	{ month: "Jun", organic: 210, paid: 120, referral: 70 },
];

const KEYS = ["organic", "paid", "referral"] as const;

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

function roundTop(info: ChartBarStackSegmentInfo): ChartBarStackSegmentOptions {
	return info.isTop ? { roundedCorners: { topLeft: 4, topRight: 4 } } : {};
}

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart
				data={DATA}
				domainPadding={{ x: 0.5 }}
				font={font}
				includeZero
				stackKeys={KEYS}
				xKey="month"
				yKeys={KEYS}
			>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartBarStack barOptions={roundTop} colors={["#0A84FF", "#30D158", "#FF9F0A"]} yKeys={KEYS} />
			</CartesianChart>
		</View>
	);
}
