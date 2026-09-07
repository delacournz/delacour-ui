import {
	CartesianChart,
	ChartGrid,
	ChartLine,
	ChartXAxis,
	ChartYAxis,
	type CurveType,
	useSystemFont,
} from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Curves",
	caption:
		"`curve` on the root sets the interpolator for every mark; `curve` on a mark overrides it. Every line here is the same data.",
	note: "`monotone` cannot overshoot, so a line through non-negative data never dips below zero and invents a loss that never happened. `linear`, `natural` and `step` are the other three drawn here.",
	capture: { align: "stretch" },
};

const VALUES = [10, 62, 58, 12, 48, 44];

const CURVES = ["linear", "monotone", "natural", "step"] as const satisfies readonly CurveType[];

const COLORS: Record<(typeof CURVES)[number], string> = {
	linear: "#0A84FF",
	monotone: "#30D158",
	natural: "#FF9F0A",
	step: "#FF375F",
};

/** One row per point, carrying the same value under every curve's name, so the four lines differ only in how they travel between points. */
const DATA = VALUES.map((value, index) => ({
	x: String(index + 1),
	linear: value,
	monotone: value,
	natural: value,
	step: value,
}));

const styles = StyleSheet.create({
	chart: { height: 240, width: "100%" },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<CartesianChart data={DATA} font={font} xKey="x" yKeys={["linear", "monotone", "natural", "step"]}>
				<ChartGrid color="#8E8E9340" />
				<ChartYAxis color="#8E8E93" />
				<ChartXAxis color="#8E8E93" />
				{CURVES.map((curve) => (
					<ChartLine color={COLORS[curve]} curve={curve} key={curve} yKey={curve} />
				))}
			</CartesianChart>
		</View>
	);
}
