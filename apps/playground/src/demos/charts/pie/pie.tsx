import { PieLabel, PieSlices, PolarChart, useSystemFont } from "delacour-react-native-charts";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A pie",
	caption:
		"A pie is its own root. `PolarChart` takes a `valueKey` and a `labelKey`, `PieSlices` paints one colour per slice, and `PieLabel` writes each slice's label across the middle of it.",
	capture: { align: "stretch" },
};

const DATA = [
	{ browser: "Chrome", share: 64 },
	{ browser: "Safari", share: 19 },
	{ browser: "Edge", share: 9 },
	{ browser: "Other", share: 8 },
];

const styles = StyleSheet.create({
	chart: { alignSelf: "center", height: 240, width: 240 },
});

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);

	return (
		<View style={styles.chart}>
			<PolarChart data={DATA} font={font} labelKey="browser" valueKey="share">
				<PieSlices colors={["#0A84FF", "#30D158", "#FF9F0A", "#FF375F"]} />
				<PieLabel color="#FFFFFF" minSweep={20} />
			</PolarChart>
		</View>
	);
}
