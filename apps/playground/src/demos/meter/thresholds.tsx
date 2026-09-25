import { Button } from "@delacour/react-native-ui/button";
import { Meter, type MeterThreshold } from "@delacour/react-native-ui/meter";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Thresholds",
	note: "Each threshold names the colour from a point on the scale, in the reading's own units. The highest one reached wins, whatever order they are listed in; below all of them the color prop applies. Step the load and watch it cross each one.",
	capture: { align: "stretch" },
};

const THRESHOLDS: readonly MeterThreshold[] = [
	{ color: "destructive", from: 90 },
	{ color: "info", from: 0 },
	{ color: "warning", from: 70 },
];

const STEP = 10;

function clamp(value: number): number {
	return Math.min(100, Math.max(0, value));
}

export function Demo(): ReactElement {
	const [load, setLoad] = useState(45);

	return (
		<View className="gap-5">
			<Meter testID="meter-thresholds" thresholds={THRESHOLDS} value={load}>
				<Meter.Header>
					<Meter.Label>CPU load</Meter.Label>
					<Meter.Output testID="meter-thresholds-output" />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
			<Text.Caption color="muted">Info from 0 · warning from 70 · destructive from 90</Text.Caption>
			<View className="flex-row gap-2">
				<Button
					className="flex-1"
					onPress={() => setLoad((current) => clamp(current - STEP))}
					size="sm"
					testID="meter-thresholds-decrement"
					variant="secondary"
				>
					<Button.Label>−10</Button.Label>
				</Button>
				<Button
					className="flex-1"
					onPress={() => setLoad((current) => clamp(current + STEP))}
					size="sm"
					testID="meter-thresholds-increment"
					variant="secondary"
				>
					<Button.Label>+10</Button.Label>
				</Button>
				<Button
					className="flex-1"
					onPress={() => setLoad(45)}
					size="sm"
					testID="meter-thresholds-reset"
					variant="ghost"
				>
					<Button.Label>Reset</Button.Label>
				</Button>
			</View>
		</View>
	);
}
