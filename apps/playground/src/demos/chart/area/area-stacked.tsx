import { Chart } from "delacour-react-native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stacked areas",
	caption:
		"Areas naming the same `stackId` stand on one another: each is the band from the top of the series below to its own running total.",
	note: "The topmost edge is the sum. The stack shares its one slot with the bars — a chart holds one stack, whichever mark builds it.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80, tablet: 40 },
	{ month: "Feb", desktop: 305, mobile: 200, tablet: 60 },
	{ month: "Mar", desktop: 237, mobile: 120, tablet: 55 },
	{ month: "Apr", desktop: 173, mobile: 190, tablet: 70 },
	{ month: "May", desktop: 209, mobile: 130, tablet: 85 },
	{ month: "Jun", desktop: 314, mobile: 140, tablet: 90 },
];

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
	tablet: { label: "Tablet" },
};

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} includeZero xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Area stackId="devices" yKey="desktop" />
			<Chart.Area stackId="devices" yKey="mobile" />
			<Chart.Area stackId="devices" yKey="tablet" />
			<Chart.Legend />
		</Chart>
	);
}
