import { PieChart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A pie",
	caption:
		"A second root, not a part of `Chart`. Its categories are its rows: the first row is `chart-1`, the second `chart-2`, and no `config` is needed at all.",
	note: "A hairline in the chart's background runs between neighbouring slices. Two ramp colours side by side with no gap read as one shape with a stripe.",
	capture: { align: "center" },
};

const DATA = [
	{ browser: "Chrome", visitors: 275 },
	{ browser: "Safari", visitors: 200 },
	{ browser: "Firefox", visitors: 187 },
	{ browser: "Edge", visitors: 173 },
	{ browser: "Other", visitors: 90 },
];

export function Demo(): ReactElement {
	return (
		<View className="w-72">
			<PieChart data={DATA} nameKey="browser" testID="chart-pie" valueKey="visitors">
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		</View>
	);
}
