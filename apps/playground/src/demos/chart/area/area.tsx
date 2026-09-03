import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An area under the line",
	caption: "The fill takes the series' own colour and fades out towards the baseline.",
	capture: { align: "stretch" },
};

const DATA = [
	{ day: "Mon", visits: 120 },
	{ day: "Tue", visits: 180 },
	{ day: "Wed", visits: 150 },
	{ day: "Thu", visits: 240 },
	{ day: "Fri", visits: 310 },
	{ day: "Sat", visits: 280 },
	{ day: "Sun", visits: 195 },
];

const CONFIG = { visits: { label: "Visits" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} includeZero xKey="day">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Area yKey="visits" />
			<Chart.Line yKey="visits" />
		</Chart>
	);
}
