import { KPI_TREND_VARIANTS, Kpi, type KpiTrendVariant } from "@delacour/react-native-ui/kpi";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Trend variants",
	caption:
		"`text` is a line of colour under the number — what a stat card usually wants. `badge` puts a pill round it, with an arrow that says the direction again in a shape.",
};

const LABELS: Record<KpiTrendVariant, string> = {
	text: "Text",
	badge: "Badge",
};

const CHANGES = [12.4, -3.1, 0] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{KPI_TREND_VARIANTS.map((variant) => (
				<Kpi key={variant} size="sm" testID={`kpi-trend-${variant}`}>
					<Kpi.Header>
						<Kpi.Title>{LABELS[variant]}</Kpi.Title>
					</Kpi.Header>
					<Kpi.Content className="flex-row flex-wrap gap-x-6 gap-y-2">
						{CHANGES.map((change) => (
							<Kpi.Trend key={change} value={change} variant={variant} />
						))}
					</Kpi.Content>
				</Kpi>
			))}
		</View>
	);
}
