import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A legend",
	caption:
		"A React Native view under the canvas, so it carries the type scale and a colour token — neither of which exists inside Skia.",
	capture: { align: "stretch" },
};

const DATA = [
	{ week: "W1", ios: 320, android: 240 },
	{ week: "W2", ios: 380, android: 290 },
	{ week: "W3", ios: 350, android: 330 },
	{ week: "W4", ios: 470, android: 360 },
];

const CONFIG = {
	ios: { label: "iOS" },
	android: { label: "Android" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="week">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Area yKey="ios" />
			<Chart.Line yKey="ios" />
			<Chart.Line yKey="android" />
			<Chart.Legend />
		</Chart>
	);
}
