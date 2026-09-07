import {
	CartesianChart,
	ChartGrid,
	ChartScatter,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scatter",
	caption:
		"A numeric x, and one `ChartScatter` per series. Every point of a series is drawn into a single path, so a thousand dots cost the Skia tree one node.",
	capture: { align: "stretch" },
};

const DATA = [
	{ x: 1, a: 12, b: 30 },
	{ x: 2, a: 18, b: 26 },
	{ x: 3, a: 15, b: 34 },
	{ x: 4, a: 24, b: 22 },
	{ x: 5, a: 21, b: 38 },
	{ x: 6, a: 30, b: 19 },
	{ x: 7, a: 27, b: 41 },
	{ x: 8, a: 35, b: 16 },
	{ x: 9, a: 33, b: 44 },
	{ x: 10, a: 40, b: 12 },
];

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart data={DATA} domainPadding={0.1} font={font} xKey="x" yKeys={["a", "b"]}>
				<ChartGrid axis="both" color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartScatter color="#0A84FF" radius={5} yKey="a" />
				<ChartScatter color="#FF375F" radius={5} shape="square" yKey="b" />
			</CartesianChart>
		</View>
	);
}
