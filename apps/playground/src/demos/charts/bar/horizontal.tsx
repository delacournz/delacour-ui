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
	title: "Horizontal bars",
	caption:
		'`orientation="horizontal"` on the root runs the categories down the left and the bars rightward. The marks and axes read the same flag, so nothing else on the call site changes.',
	capture: { align: "stretch" },
};

const DATA = [
	{ browser: "Chrome", share: 64 },
	{ browser: "Safari", share: 19 },
	{ browser: "Edge", share: 5 },
	{ browser: "Firefox", share: 3 },
	{ browser: "Other", share: 9 },
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
				orientation="horizontal"
				xKey="browser"
				yKeys={["share"]}
			>
				<ChartGrid axis="x" color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartBar color="#FF9F0A" roundedCorners={{ topLeft: 4, topRight: 4 }} yKey="share" />
			</CartesianChart>
		</View>
	);
}
