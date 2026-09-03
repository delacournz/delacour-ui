import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scatter",
	caption:
		"One dot per row per series, on a numeric x. A whole series is one Skia path, so a hundred points is one node.",
	note: "`radius` is every dot's size in points. A gap in the data is the same dot at radius zero, which is what lets a point come and go without the series snapping.",
	capture: { align: "stretch" },
};

const DATA = [
	{ minutes: 2, free: 1, pro: 3 },
	{ minutes: 4, free: 2, pro: 5 },
	{ minutes: 6, free: 2, pro: 7 },
	{ minutes: 8, free: 4, pro: 8 },
	{ minutes: 11, free: 3, pro: 12 },
	{ minutes: 13, free: 6, pro: 11 },
	{ minutes: 16, free: 5, pro: 15 },
	{ minutes: 19, free: 8, pro: 17 },
	{ minutes: 22, free: 7, pro: 21 },
	{ minutes: 25, free: 10, pro: 22 },
	{ minutes: 28, free: 9, pro: 26 },
	{ minutes: 31, free: 12, pro: 28 },
];

const CONFIG = {
	free: { label: "Free" },
	pro: { label: "Pro" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} includeZero xKey="minutes">
			<Chart.Grid axis="both" />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Scatter radius={5} yKey="free" />
			<Chart.Scatter radius={5} yKey="pro" />
			<Chart.Legend />
		</Chart>
	);
}
