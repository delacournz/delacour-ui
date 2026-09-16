import { Chart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bars below zero",
	caption:
		"A negative value hangs from the baseline instead of standing on it, and its rounded end is the one furthest from zero.",
	note: "The baseline sits where zero falls in the domain, so a chart of mixed signs draws it through the middle of the plot rather than along the bottom edge.",
	capture: { align: "stretch" },
};

const DATA = [
	{ month: "Jan", net: 42 },
	{ month: "Feb", net: -18 },
	{ month: "Mar", net: 27 },
	{ month: "Apr", net: -35 },
	{ month: "May", net: 12 },
	{ month: "Jun", net: 58 },
	{ month: "Jul", net: -9 },
];

const CONFIG = { net: { label: "Net cash flow" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="month">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Bar yKey="net" />
		</Chart>
	);
}
