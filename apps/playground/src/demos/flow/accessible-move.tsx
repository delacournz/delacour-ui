import { Card } from "@delacour/react-native-ui/card";
import { Flow, type FlowConnection, type FlowPoint } from "@delacour/react-native-ui/flow";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Assistive actions",
	caption:
		"With a screen reader, each node is one stop with actions for everything a finger can do: select, move up, down, left and right, connect to each valid target, and delete. They report through the same callbacks as the gestures.",
};

const START: Record<string, FlowPoint> = { draft: { x: 0, y: 0 }, review: { x: 220, y: 0 }, publish: { x: 440, y: 0 } };

export function Demo(): ReactElement {
	const [positions, setPositions] = useState(START);
	const [edges, setEdges] = useState<FlowConnection[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const ids = Object.keys(positions);

	return (
		<Flow
			className="h-64 rounded-lg"
			fitViewOnMount
			onConnect={(connection) => setEdges((current) => [...current, connection])}
			onNodeDragEnd={(id, position) => setPositions((current) => ({ ...current, [id]: position }))}
			testID="flow-accessible"
		>
			{ids.map((id) => (
				<Flow.Node
					accessibilityLabel={`${id} stage`}
					id={id}
					isSelected={selected === id}
					key={id}
					onDelete={() =>
						setPositions((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)))
					}
					onPress={() => setSelected(id)}
					position={positions[id] ?? { x: 0, y: 0 }}
				>
					<Card className="w-40" size="sm">
						<Card.Header>
							<Card.Title>{id}</Card.Title>
						</Card.Header>
					</Card>
					<Flow.Handle id="in" side="left" type="target" />
					<Flow.Handle id="out" side="right" />
				</Flow.Node>
			))}
			{edges.map((edge) => (
				<Flow.Edge from={`${edge.source}.out`} key={`${edge.source}-${edge.target}`} to={`${edge.target}.in`} />
			))}
		</Flow>
	);
}
