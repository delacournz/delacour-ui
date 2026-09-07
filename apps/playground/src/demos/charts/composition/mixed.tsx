import {
	CartesianChart,
	ChartBar,
	ChartGrid,
	ChartLine,
	ChartScatter,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A bar and a line on one axis",
	caption:
		"Marks are independent of one another, so a bar series and a line series share one root, one x axis and one y scale. The root's `domainPadding` and `includeZero` serve the bars; the line simply rides along.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", units: 42, target: 50 },
	{ month: "Feb", units: 58, target: 55 },
	{ month: "Mar", units: 51, target: 60 },
	{ month: "Apr", units: 73, target: 65 },
	{ month: "May", units: 68, target: 70 },
	{ month: "Jun", units: 91, target: 75 },
];

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart
				data={DATA}
				domainPadding={{ x: 0.5 }}
				font={font}
				includeZero
				xKey="month"
				yKeys={["units", "target"]}
			>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartBar color="#0A84FF66" roundedCorners={{ topLeft: 4, topRight: 4 }} yKey="units" />
				<ChartLine color="#FF9F0A" curve="linear" yKey="target" />
				<ChartScatter color="#FF9F0A" radius={4} yKey="target" />
			</CartesianChart>
		</View>
	);
}
