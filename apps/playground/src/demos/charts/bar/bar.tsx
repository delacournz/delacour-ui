import {
	CartesianChart,
	ChartBar,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bars",
	caption:
		"Bars stand on zero, so the root takes `includeZero`, and `domainPadding={{ x: 0.5 }}` pads the x domain by half a step each side so the outermost bars sit inside the plot.",
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
			<CartesianChart data={DATA} domainPadding={{ x: 0.5 }} font={font} includeZero xKey="month" yKeys={["revenue"]}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartBar color="#0A84FF" roundedCorners={{ topLeft: 4, topRight: 4 }} yKey="revenue" />
			</CartesianChart>
		</View>
	);
}
