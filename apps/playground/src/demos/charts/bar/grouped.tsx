import {
	CartesianChart,
	ChartBarGroup,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Grouped bars",
	caption:
		"`ChartBarGroup` takes the `yKeys` to stand side by side and one colour each. It has to know how many series there are before any of them can know its offset, which is why it takes keys rather than child marks.",
	capture: { align: "stretch" },
};

const DATA = [
	{ quarter: "Q1", desktop: 42, mobile: 28 },
	{ quarter: "Q2", desktop: 58, mobile: 36 },
	{ quarter: "Q3", desktop: 51, mobile: 44 },
	{ quarter: "Q4", desktop: 73, mobile: 51 },
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
				xKey="quarter"
				yKeys={["desktop", "mobile"]}
			>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartBarGroup
					colors={["#0A84FF", "#30D158"]}
					roundedCorners={{ topLeft: 3, topRight: 3 }}
					yKeys={["desktop", "mobile"]}
				/>
			</CartesianChart>
		</View>
	);
}
