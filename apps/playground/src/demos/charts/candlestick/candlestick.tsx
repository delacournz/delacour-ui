import {
	CartesianChart,
	ChartCandlestick,
	ChartGrid,
	ChartXAxis,
	ChartYAxis,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Candlesticks",
	caption:
		"Four `yKeys` — open, high, low, close — and one mark that names which is which. `candleColors` paints a rising, a falling and a flat candle, and the wicks are drawn under the bodies.",
	capture: { align: "stretch" },
};

const DATA = [
	{ day: "1", open: 100, high: 108, low: 97, close: 105 },
	{ day: "2", open: 105, high: 111, low: 102, close: 103 },
	{ day: "3", open: 103, high: 106, low: 96, close: 98 },
	{ day: "4", open: 98, high: 104, low: 95, close: 102 },
	{ day: "5", open: 102, high: 110, low: 101, close: 109 },
	{ day: "6", open: 109, high: 114, low: 106, close: 107 },
	{ day: "7", open: 107, high: 109, low: 100, close: 101 },
	{ day: "8", open: 101, high: 103, low: 99, close: 101 },
	{ day: "9", open: 101, high: 112, low: 100, close: 111 },
	{ day: "10", open: 111, high: 118, low: 110, close: 116 },
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
				domainPadding={{ x: 0.5, y: 0.1 }}
				font={font}
				xKey="day"
				yKeys={["open", "high", "low", "close"]}
			>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				<ChartCandlestick
					candleColors={{ positive: "#30D158", negative: "#FF375F", neutral: "#8E8E93" }}
					keys={{ open: "open", high: "high", low: "low", close: "close" }}
				/>
			</CartesianChart>
		</View>
	);
}
