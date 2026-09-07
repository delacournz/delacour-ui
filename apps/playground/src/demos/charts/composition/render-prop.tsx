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
	title: "The render prop",
	caption:
		"`children` may be a function of the resolved chart. It receives the canvas `points` for every key, the plot `bounds` and the scales, and each mark is handed exactly the points it draws.",
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
			<CartesianChart data={DATA} font={font} xKey="day" yKeys={["revenue"]}>
				{({ points, bounds }) => (
					<>
						<ChartGrid color="#8E8E9340" />
						<ChartYAxis color="#8E8E93" />
						<ChartXAxis color="#8E8E93" />
						<ChartArea baseline={bounds.bottom} color="#0A84FF22" curve="monotone" points={points.revenue} />
						<ChartLine color="#0A84FF" curve="monotone" points={points.revenue} strokeWidth={2} />
					</>
				)}
			</CartesianChart>
		</View>
	);
}
