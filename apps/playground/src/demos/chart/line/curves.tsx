import { CHART_CURVES, Chart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Curves",
	align: "stretch",
	capture: { align: "stretch" },
	caption: "How the line gets from one point to the next. Every series here is the same data.",
	note: "`monotone` is the default: it is the only interpolating curve here that cannot overshoot, so a line through non-negative data never dips below zero and invents a loss that never happened.",
};

const VALUES = [10, 62, 58, 12, 48, 44];

/**
 * One row per point, carrying the same value under every curve's name.
 *
 * Drawing them on one chart rather than four is what makes this a comparison:
 * the curves share every data point and differ only in how they travel between
 * them, which is the entire subject and is invisible when each has its own
 * plot to itself.
 */
const DATA = VALUES.map((value, index) => ({
	x: String(index + 1),
	...Object.fromEntries(CHART_CURVES.map((curve) => [curve, value])),
}));

const CONFIG = Object.fromEntries(CHART_CURVES.map((curve) => [curve, { label: curve }]));

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="x">
			<Chart.Grid />
			{CHART_CURVES.map((curve) => (
				<Chart.Line curve={curve} key={curve} yKey={curve} />
			))}
			<Chart.Legend />
		</Chart>
	);
}
