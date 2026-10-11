import { Card } from "@delacour/react-native-ui/card";
import { Flow, type FlowPoint } from "@delacour/react-native-ui/flow";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Drag",
	caption:
		"A drag renders nothing while it moves. The app hears once, from `onNodeDragEnd`, and stores the new position.",
};

export function Demo(): ReactElement {
	const [position, setPosition] = useState<FlowPoint>({ x: 40, y: 40 });

	return (
		<View className="gap-2">
			<Flow className="h-72 rounded-lg" onNodeDragEnd={(_id, next) => setPosition(next)} testID="flow-drag">
				<Flow.Background variant="cross" />
				<Flow.Node id="card" position={position} testID="flow-drag-node">
					<Card className="w-40" size="sm">
						<Card.Header>
							<Card.Title>Drag me</Card.Title>
						</Card.Header>
					</Card>
				</Flow.Node>
				<Flow.Node id="anchor" isDraggable={false} position={{ x: 220, y: 160 }}>
					<Card className="w-32" size="sm" variant="secondary">
						<Card.Header>
							<Card.Title>Anchor</Card.Title>
						</Card.Header>
					</Card>
				</Flow.Node>
				<Flow.Edge from="card" isDashed to="anchor" variant="step" />
			</Flow>
			<Text.Caption testID="flow-drag-position">
				{`x ${Math.round(position.x)}, y ${Math.round(position.y)}`}
			</Text.Caption>
		</View>
	);
}
