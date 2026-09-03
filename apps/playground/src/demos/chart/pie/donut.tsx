import { PieChart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A donut",
	caption:
		"`innerRadius` is the hole as a fraction of the radius. `PieChart.Center` puts a headline figure in it — a React Native view, so it carries the type scale.",
	note: "The centre takes no touches, so a tap through it still lands on a slice.",
	capture: { align: "center" },
};

const DATA = [
	{ plan: "Free", seats: 640 },
	{ plan: "Team", seats: 310 },
	{ plan: "Business", seats: 175 },
];

export function Demo(): ReactElement {
	return (
		<View className="w-72">
			<PieChart data={DATA} innerRadius={0.62} nameKey="plan" testID="chart-donut" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Center label="Seats" value="1,125" />
				<PieChart.Legend />
			</PieChart>
		</View>
	);
}
