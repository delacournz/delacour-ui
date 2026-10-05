import { Button } from "@delacour/react-native-ui/button";
import { Compare, type ComparePosition } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"Pass `position` to hold it yourself. The drag reports through `onPositionChange`, the buttons write it directly, and the seam springs to whatever the parent decides.",
	align: "stretch",
	capture: { align: "stretch", flow: "compare/controlled" },
};

const PRESETS: readonly { label: string; position: ComparePosition }[] = [
	{ label: "Before", position: 1 },
	{ label: "Half", position: 0.5 },
	{ label: "After", position: 0 },
];

export function Demo(): ReactElement {
	const [position, setPosition] = useState<ComparePosition>(0.5);

	return (
		<View className="gap-3">
			<Compare
				accessibilityLabel="Redesign"
				className="aspect-[4/3]"
				onPositionChange={setPosition}
				position={position}
			>
				<Compare.Before>
					<View className="flex-1 items-start justify-center bg-secondary px-6">
						<Text.Title>Original</Text.Title>
					</View>
				</Compare.Before>
				<Compare.After>
					<View className="flex-1 items-end justify-center bg-success px-6">
						<Text.Title className="text-success-foreground">Redesign</Text.Title>
					</View>
				</Compare.After>
				<Compare.Handle testID="compare-controlled-handle" />
			</Compare>
			<View className="flex-row gap-2">
				{PRESETS.map((preset) => (
					<Button
						key={preset.label}
						onPress={() => setPosition(preset.position)}
						size="sm"
						testID={`compare-controlled-${preset.label.toLowerCase()}`}
						variant="outline"
					>
						{preset.label}
					</Button>
				))}
			</View>
			<Text.Caption color="muted">{`${Math.round(position * 100)}% before`}</Text.Caption>
		</View>
	);
}
