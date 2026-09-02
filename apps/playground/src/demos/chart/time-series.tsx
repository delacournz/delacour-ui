import { Chart } from "@delacour/native-ui/chart";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Dates on the x axis",
	align: "stretch",
	caption:
		"A `Date` field switches the axis to a time scale on its own, and the ticks land on calendar boundaries rather than on even multiples of milliseconds.",
	note: "That distinction is why the engine takes `d3-scale`: a spring-forward day is 23 hours, and a hand-rolled ladder would put every tick an hour off midnight for half the year.",
};

const START = new Date(2026, 0, 1).getTime();
const DAY = 86_400_000;

const DATA = Array.from({ length: 30 }, (_, index) => ({
	at: new Date(START + index * DAY),
	price: 100 + Math.round(Math.sin(index / 3) * 18 + index * 1.4),
}));

const CONFIG = { price: { label: "Price" } };

export function Demo(): ReactElement {
	return (
		<Chart config={CONFIG} data={DATA} xKey="at">
			<Chart.Grid />
			<Chart.YAxis />
			<Chart.XAxis />
			<Chart.Area yKey="price" />
			<Chart.Line yKey="price" />
			<Chart.Tooltip.X />
			<Chart.Tooltip.Y />
			<Chart.Tooltip.Dot />
			<Chart.Tooltip />
		</Chart>
	);
}
