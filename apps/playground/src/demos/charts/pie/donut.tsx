import { PieLabel, type PieSliceData, PieSlices, PolarChart, useSystemFont } from "delacour-react-native-charts";
import { type ReactElement, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A donut, with a tap",
	caption:
		"`innerRadius` cuts the hole, as points or a percentage of the radius. `onSlicePress` reports the slice under a tap, and `selectedIndex` hands it back so `PieSlices` can dim the others.",
	capture: { align: "stretch" },
};

const DATA = [
	{ plan: "Free", seats: 640 },
	{ plan: "Team", seats: 310 },
	{ plan: "Business", seats: 175 },
];

const styles = StyleSheet.create({
	chart: { alignSelf: "center", height: 240, width: 240 },
});

function percent(slice: PieSliceData): string {
	return `${Math.round(slice.fraction * 100)}%`;
}

export function Demo(): ReactElement {
	const font = useSystemFont(undefined, 12);
	const [selected, setSelected] = useState<number | null>(null);

	return (
		<View style={styles.chart} testID="charts-donut">
			<PolarChart
				data={DATA}
				font={font}
				innerRadius="60%"
				labelKey="plan"
				onSlicePress={setSelected}
				selectedIndex={selected}
				valueKey="seats"
			>
				<PieSlices colors={["#0A84FF", "#30D158", "#FF9F0A"]} />
				<PieLabel color="#FFFFFF" formatLabel={percent} minSweep={12} />
			</PolarChart>
		</View>
	);
}
