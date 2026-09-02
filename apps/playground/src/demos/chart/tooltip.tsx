import { Chart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Press to read a value",
	caption:
		"Hold and drag. The readout follows the finger on the UI thread; its text updates only when the nearest point changes.",
	note: "Holding first is deliberate — a chart inside a scrolling list must not steal the scroll.",
	capture: { align: "stretch", flow: "chart/tooltip" },
};

const DATA = [
	{ month: "Jan", desktop: 42, mobile: 28 },
	{ month: "Feb", desktop: 58, mobile: 36 },
	{ month: "Mar", desktop: 51, mobile: 44 },
	{ month: "Apr", desktop: 73, mobile: 51 },
	{ month: "May", desktop: 68, mobile: 62 },
	{ month: "Jun", desktop: 91, mobile: 74 },
];

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} testID="chart-tooltip" xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Line yKey="desktop" />
			<Chart.Line yKey="mobile" />
			<Chart.Tooltip />
		</Chart>
	);
}
