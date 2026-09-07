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
	title: "Placed, not called",
	caption:
		"The same chart as the render prop, with the marks placed as children. A mark given a `yKey` reads its points from the chart's context; one given `points` draws those. One implementation serves both, so they cannot drift.",
	capture: { align: "stretch" },
};

const DATA = [
	{ day: "Mon", revenue: 42 },
	{ day: "Tue", revenue: 58 },
	{ day: "Wed", revenue: 51 },
	{ day: "Thu", revenue: 73 },
	{ day: "Fri", revenue: 68 },
	{ day: "Sat", revenue: 91 },
	{ day: "Sun", revenue: 84 },
];

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart curve="monotone" data={DATA} font={font} xKey="day" yKeys={["revenue"]}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartArea color="#0A84FF22" yKey="revenue" />
				<ChartLine color="#0A84FF" yKey="revenue" />
			</CartesianChart>
		</View>
	);
}
