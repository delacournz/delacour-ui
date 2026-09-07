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
	title: "A line",
	caption:
		"The root takes rows, an `xKey` and the `yKeys` to measure, and every mark inside it names a series and a colour. No theme, no tokens — every value is one you passed.",
	capture: { align: "stretch", hero: true },
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

/** The font is resolved above the canvas, because no hook can be called inside it. */
export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart data={DATA} font={font} xKey="month" yKeys={["revenue"]}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartLine color="#0A84FF" yKey="revenue" />
			</CartesianChart>
		</View>
	);
}
