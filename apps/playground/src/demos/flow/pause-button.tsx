import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Flow } from "@delacour/react-native-ui/flow";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pause button",
	caption:
		"`isPaused` on the root freezes every animated edge's dashes in place; clearing it marches them on from where they stopped.",
};

export function Demo(): ReactElement {
	const [isPaused, setIsPaused] = useState(false);

	return (
		<View className="gap-4">
			<Flow
				canPan={false}
				canZoom={false}
				className="h-64 rounded-lg"
				fitViewOnMount
				isPaused={isPaused}
				testID="flow-pause-button"
			>
				<Flow.Node id="queue" isDraggable={false} position={{ x: 0, y: 60 }}>
					<Badge variant="soft">queue</Badge>
				</Flow.Node>
				<Flow.Node id="worker" isDraggable={false} position={{ x: 220, y: 0 }}>
					<Badge variant="soft">worker</Badge>
				</Flow.Node>
				<Flow.Edge color="primary" from="queue" hasArrow isAnimated to="worker" />
			</Flow>
			<Button onPress={() => setIsPaused((paused) => !paused)} testID="flow-pause-toggle">
				<Button.Label>{isPaused ? "Resume" : "Pause"}</Button.Label>
			</Button>
		</View>
	);
}
