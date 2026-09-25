import { Kpi } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group",
	caption:
		"`Kpi.Group` in a row gives each metric an equal share. `separated` sets them on one surface with a rule between each — one panel rather than several that happen to be adjacent.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Kpi.Group orientation="horizontal" separated testID="kpi-group-separated">
				<Kpi size="sm">
					<Kpi.Content>
						<Kpi.Stat>
							<Kpi.Title>Visitors</Kpi.Title>
							<Kpi.Value>12.4k</Kpi.Value>
							<Kpi.Trend value={5.2} />
						</Kpi.Stat>
					</Kpi.Content>
				</Kpi>
				<Kpi goodDirection="down" size="sm">
					<Kpi.Content>
						<Kpi.Stat>
							<Kpi.Title>Bounce rate</Kpi.Title>
							<Kpi.Value>38%</Kpi.Value>
							<Kpi.Trend value={2.1} />
						</Kpi.Stat>
					</Kpi.Content>
				</Kpi>
			</Kpi.Group>
			<Kpi.Group orientation="horizontal" testID="kpi-group-spaced">
				<Kpi colorIndex={2} size="sm">
					<Kpi.Content>
						<Kpi.Stat>
							<Kpi.Title>Orders</Kpi.Title>
							<Kpi.Value>1,284</Kpi.Value>
						</Kpi.Stat>
						<Kpi.Sparkline data={[4, 5, 4.6, 6, 5.8, 7]} interactive={false} />
					</Kpi.Content>
				</Kpi>
				<Kpi colorIndex={3} size="sm">
					<Kpi.Content>
						<Kpi.Stat>
							<Kpi.Title>Returns</Kpi.Title>
							<Kpi.Value>37</Kpi.Value>
						</Kpi.Stat>
						<Kpi.Sparkline data={[6, 5.4, 5.8, 4.9, 4.4, 4.1]} interactive={false} />
					</Kpi.Content>
				</Kpi>
			</Kpi.Group>
			<Kpi.Group separated testID="kpi-group-vertical">
				<Kpi size="sm">
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Title>Uptime</Kpi.Title>
							<Kpi.Value>99.98%</Kpi.Value>
						</Kpi.Stat>
						<Kpi.Trend goodDirection="none" value={0} />
					</Kpi.Content>
				</Kpi>
				<Kpi goodDirection="down" size="sm">
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Title>Incidents</Kpi.Title>
							<Kpi.Value>2</Kpi.Value>
						</Kpi.Stat>
						<Kpi.Trend value={-50} variant="badge" />
					</Kpi.Content>
				</Kpi>
			</Kpi.Group>
		</View>
	);
}
