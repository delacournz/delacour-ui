import { KPI_SIZES, Kpi, type KpiSize } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"The card's three sizes. One axis moves the inset, the value's scale, the change and the sparkline's height together.",
};

const LABELS: Record<KpiSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

const VISITS = [820, 910, 870, 1040, 990, 1120, 1210, 1180, 1302];

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{KPI_SIZES.map((size) => (
				<Kpi colorIndex={2} key={size} size={size} testID={`kpi-size-${size}`}>
					<Kpi.Header>
						<Kpi.Title>{LABELS[size]}</Kpi.Title>
					</Kpi.Header>
					<Kpi.Content>
						<Kpi.Stat>
							<Kpi.Value>1,302</Kpi.Value>
							<Kpi.Trend caption="vs last week" value={10.3} />
						</Kpi.Stat>
						<Kpi.Sparkline data={VISITS} interactive={false} />
					</Kpi.Content>
				</Kpi>
			))}
		</View>
	);
}
