import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckCircle2, IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Marker } from "@delacour/react-native-ui/marker";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Running",
	caption:
		"`shimmer` breathes the text while the step runs. Drop it the moment the step ends: a marker that shimmers forever reads as a stuck one.",
	capture: { align: "stretch", flow: "marker/running" },
};

export function Demo(): ReactElement {
	const [isRunning, setIsRunning] = useState(false);

	return (
		<View className="items-center gap-3">
			<Marker testID="running-marker">
				<Marker.Icon>
					<Icon icon={isRunning ? IconMagnifyingGlass : IconCheckCircle2} />
				</Marker.Icon>
				<Marker.Content shimmer={isRunning}>{isRunning ? "Searching files" : "Searched 128 files"}</Marker.Content>
			</Marker>
			<Button onPress={() => setIsRunning((running) => !running)} size="sm" testID="toggle-running" variant="secondary">
				{isRunning ? "Finish step" : "Run step"}
			</Button>
		</View>
	);
}
