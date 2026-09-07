import {
	CartesianChart,
	ChartArea,
	ChartGrid,
	ChartLine,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An area",
	caption:
		"`ChartArea` fills between a series and a baseline, which defaults to the bottom of the plot. A `ChartLine` over the same key draws its edge.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", revenue: 42 },
	{ month: "Feb", revenue: 58 },
	{ month: "Mar", revenue: 51 },
	{ month: "Apr", revenue: 73 },
	{ month: "May", revenue: 68 },
	{ month: "Jun", revenue: 91 },
];

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart data={DATA} font={font} xKey="month" yKeys={["revenue"]}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartArea color="#0A84FF33" yKey="revenue" />
				<ChartLine color="#0A84FF" yKey="revenue" />
			</CartesianChart>
		</View>
	);
}
