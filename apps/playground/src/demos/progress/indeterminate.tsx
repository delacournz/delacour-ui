import { Progress } from "@delacour/react-native-ui/progress";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Indeterminate",
	note: "A segment sweeps from wholly off the left edge to wholly off the right, so the loop's seam is never on screen. With Reduce Motion on, it breathes in place instead. It reports busy and no value to a screen reader, and the default readout renders nothing.",
};

export function Demo(): ReactElement {
	const [isKnown, setIsKnown] = useState(false);

	return (
		<View className="gap-6">
			<Progress color="info" isIndeterminate={!isKnown} testID="progress-indeterminate" value={35}>
				<Progress.Header>
					<Progress.Label>{isKnown ? "Exporting" : "Preparing export"}</Progress.Label>
					<Progress.Output />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
			<View className="flex-row items-center justify-between">
				<Text.Label>Size known</Text.Label>
				<Switch isSelected={isKnown} onSelectedChange={setIsKnown} testID="progress-indeterminate-toggle" />
			</View>
			<View className="gap-3">
				<Text.Caption color="muted">Bare, one per size</Text.Caption>
				<Progress accessibilityLabel="Syncing" isIndeterminate size="sm" />
				<Progress accessibilityLabel="Syncing" isIndeterminate />
				<Progress accessibilityLabel="Syncing" isIndeterminate size="lg" />
			</View>
		</View>
	);
}
