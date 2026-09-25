import {
	formatKpiTrend,
	KPI_GOOD_DIRECTIONS,
	Kpi,
	type KpiGoodDirection,
	type KpiTrendVariant,
} from "@delacour/react-native-ui/kpi";
import { Slider } from "@delacour/react-native-ui/slider";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Which way is good",
	caption:
		"Colour comes from what the movement means, not from its sign. Drag the change: revenue reads a rise as good news, churn reads the same rise as bad, and headcount reads it as neither.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const METRIC: Record<KpiGoodDirection, { title: string; value: string }> = {
	up: { title: "Revenue", value: "$48,120" },
	down: { title: "Churn", value: "2.1%" },
	none: { title: "Headcount", value: "214" },
};

const TREND_VARIANT: KpiTrendVariant = "badge";

export function Demo(): ReactElement {
	const [change, setChange] = useState(6.4);

	return (
		<View className="gap-4">
			{KPI_GOOD_DIRECTIONS.map((direction) => (
				<Kpi goodDirection={direction} key={direction} size="sm" testID={`kpi-direction-${direction}`}>
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Title>{METRIC[direction].title}</Kpi.Title>
							<Kpi.Value>{METRIC[direction].value}</Kpi.Value>
						</Kpi.Stat>
						<Kpi.Trend testID={`kpi-direction-${direction}-trend`} value={change} variant={TREND_VARIANT} />
					</Kpi.Content>
				</Kpi>
			))}
			<Slider
				accessibilityLabel="Change"
				maxValue={10}
				minValue={-10}
				onChange={(next) => typeof next === "number" && setChange(next)}
				step={0.2}
				value={change}
			>
				<View className="flex-row items-center justify-between">
					<Text.Label>Change</Text.Label>
					<Text.Caption testID="kpi-direction-change">{formatKpiTrend(change)}</Text.Caption>
				</View>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb testID="kpi-direction-thumb" />
				</Slider.Track>
			</Slider>
		</View>
	);
}
