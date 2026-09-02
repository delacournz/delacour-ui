import { PieChart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tap to read a slice",
	caption:
		"A pie has no x to scrub along, so `PieChart.Tooltip` answers a tap. The tapped slice keeps its colour and the rest dim; tapping outside clears it.",
	note: "The readout sits just past the slice's outer edge on its bisector, where a callout line would point. Placing a tooltip is what makes the chart take taps at all — without one, or an `onSelect`, a pie is a picture.",
	capture: { align: "stretch", flow: "chart/pie/pie-tap" },
};

const DATA = [
	{ source: "Direct", sessions: 1240 },
	{ source: "Search", sessions: 980 },
	{ source: "Social", sessions: 610 },
	{ source: "Email", sessions: 420 },
];

export function Demo(): ReactElement {
	return (
		<PieChart data={DATA} nameKey="source" testID="chart-pie-tap" valueKey="sessions">
			<PieChart.Slice />
			<PieChart.Tooltip />
		</PieChart>
	);
}
