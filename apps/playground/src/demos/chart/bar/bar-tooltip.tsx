import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Press to read a column",
	caption:
		"Hold and drag. Over bars, `Chart.Tooltip.X` is a band one step wide rather than a rule, so it picks out the whole column the readout names.",
	note: "The band always snaps: one that glided between columns would highlight half of two bars. Set `band={false}` to get the hairline back.",
	capture: { align: "stretch", flow: "chart/bar/bar-tooltip" },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
	{ month: "Apr", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "Jun", desktop: 214, mobile: 140 },
];

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} testID="chart-bar-tooltip" xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar yKey="desktop" />
			<Chart.Bar yKey="mobile" />
			<Chart.Tooltip.X />
			<Chart.Tooltip />
		</Chart>
	);
}
