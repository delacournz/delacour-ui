import { Button } from "@delacour/react-native-ui/button";
import { Kpi } from "@delacour/react-native-ui/kpi";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled scrub",
	align: "stretch",
	caption:
		"`activeIndex` and `onActiveIndexChange` hand the scrubbed point to the screen. The buttons set it too — the value moves to that month, and scrubbing the line reports back to the same state.",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"] as const;
const LATENCY = [212, 198, 236, 176, 181, 164, 158, 149] as const;

function worstIndex(): number {
	return LATENCY.indexOf(Math.max(...LATENCY) as (typeof LATENCY)[number]);
}

export function Demo(): ReactElement {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const index = activeIndex ?? LATENCY.length - 1;

	return (
		<View className="gap-4">
			<Kpi
				activeIndex={activeIndex}
				colorIndex={4}
				goodDirection="down"
				onActiveIndexChange={setActiveIndex}
				testID="kpi-controlled"
			>
				<Kpi.Header>
					<Kpi.Title>p95 latency</Kpi.Title>
				</Kpi.Header>
				<Kpi.Content>
					<Kpi.Stat>
						<Kpi.Value testID="kpi-controlled-value">{LATENCY[index]} ms</Kpi.Value>
						<Kpi.Trend
							caption={`${MONTHS[index]} vs January`}
							value={(((LATENCY[index] ?? 0) - LATENCY[0]) / LATENCY[0]) * 100}
						/>
					</Kpi.Stat>
					<Kpi.Sparkline data={LATENCY} testID="kpi-controlled-chart" />
				</Kpi.Content>
			</Kpi>
			<View className="flex-row flex-wrap gap-2">
				<Button onPress={() => setActiveIndex(0)} size="sm" testID="kpi-controlled-first" variant="outline">
					First
				</Button>
				<Button onPress={() => setActiveIndex(worstIndex())} size="sm" testID="kpi-controlled-worst" variant="outline">
					Worst
				</Button>
				<Button onPress={() => setActiveIndex(null)} size="sm" testID="kpi-controlled-latest" variant="outline">
					Latest
				</Button>
			</View>
			<Text.Caption testID="kpi-controlled-state">
				activeIndex: {activeIndex === null ? "null" : String(activeIndex)}
			</Text.Caption>
		</View>
	);
}
