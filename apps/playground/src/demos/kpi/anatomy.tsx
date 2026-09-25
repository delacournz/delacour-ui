import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconDollar, IconDotGrid1x3Horizontal } from "@delacour/react-native-ui/icons/central";
import { Kpi } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	caption:
		"A header with a tinted icon, the metric's name and an action; the value and its change stacked as one fact; the sparkline under everything; and a footer for the comparison.",
	capture: { align: "stretch", hero: true },
};

const REVENUE = [31.2, 33.8, 32.9, 36.4, 35.1, 38.7, 41.2, 40.3, 43.9, 44.6, 46.1, 48.1];

export function Demo(): ReactElement {
	return (
		<Kpi colorIndex={1} testID="kpi-anatomy">
			<Kpi.Header>
				<Kpi.Icon>
					<Icon icon={IconDollar} />
				</Kpi.Icon>
				<Kpi.Title>Revenue</Kpi.Title>
				<Kpi.Action>
					<Button accessibilityLabel="Revenue options" size="icon-sm" variant="ghost">
						<Icon icon={IconDotGrid1x3Horizontal} />
					</Button>
				</Kpi.Action>
			</Kpi.Header>
			<Kpi.Content>
				<Kpi.Stat>
					<Kpi.Value>$48,120</Kpi.Value>
					<Kpi.Trend caption="vs last month" value={7.8} />
				</Kpi.Stat>
				<Kpi.Sparkline data={REVENUE} formatValue={(value) => `$${value.toFixed(1)}k`} testID="kpi-anatomy-chart" />
			</Kpi.Content>
			<Kpi.Footer>Updated 5 minutes ago</Kpi.Footer>
		</Kpi>
	);
}
