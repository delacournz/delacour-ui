import {
	CartesianChart,
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
	title: "Axes and the grid",
	caption:
		"`xAxis` and `yAxis` on the root plan the ticks — how many, and `formatLabel` for what they say. `ChartGrid` rules either axis or `both`, and `ChartYAxis` sits on whichever `side` it is told.",
	note: "The root reserves the left gutter for the y labels whichever side they draw on, so a right-hand axis also takes `padding={{ right }}` to make room for itself.",
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

function thousands(value: number): string {
	return `$${value}k`;
}

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart
				data={DATA}
				font={font}
				padding={{ right: 40 }}
				xKey="month"
				yAxis={{ formatLabel: thousands, tickCount: 4 }}
				yKeys={["revenue"]}
			>
				<ChartGrid axis="both" color="#8E8E9340" dash={[4, 4]} />
				<ChartYAxis color="#8E8E93" side="right" />
				<ChartXAxis color="#8E8E93" />
				<ChartLine color="#30D158" yKey="revenue" />
			</CartesianChart>
		</View>
	);
}
