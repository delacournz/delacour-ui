import { Kpi, useKpi } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrub",
	caption:
		"Hold the sparkline and drag. A dot rides the line and the value follows it — the KPI holds the scrubbed point itself, and `useKpi()` reads it from a part of your own. Let go and it returns to the latest.",
	capture: { align: "stretch" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SESSIONS = [1840, 2120, 1990, 2410, 2630, 1720, 1560] as const;

function format(value: number): string {
	return value.toLocaleString("en-NZ");
}

/** The value and its caption, for whichever day is under the finger — or the latest when none is. */
function ScrubbedStat(): ReactElement {
	const { activeIndex } = useKpi();
	const index = activeIndex ?? SESSIONS.length - 1;
	const previous = SESSIONS[index - 1];
	const current = SESSIONS[index] ?? 0;
	const change = previous === undefined ? 0 : ((current - previous) / previous) * 100;

	return (
		<Kpi.Stat>
			<Kpi.Value testID="kpi-scrub-value">{format(current)}</Kpi.Value>
			<Kpi.Trend
				caption={activeIndex === null ? "Sunday, vs Saturday" : `${DAYS[index]}, vs day before`}
				value={change}
			/>
		</Kpi.Stat>
	);
}

export function Demo(): ReactElement {
	return (
		<Kpi colorIndex={3} testID="kpi-scrub">
			<Kpi.Header>
				<Kpi.Title>Sessions</Kpi.Title>
			</Kpi.Header>
			<Kpi.Content>
				<ScrubbedStat />
				<Kpi.Sparkline data={SESSIONS} formatValue={format} testID="kpi-scrub-chart" />
			</Kpi.Content>
		</Kpi>
	);
}
