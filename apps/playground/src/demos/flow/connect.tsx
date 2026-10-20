import { Card } from "@delacour/react-native-ui/card";
import { Flow, type FlowConnection } from "@delacour/react-native-ui/flow";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Connect",
	caption:
		"Drag from a handle to another node's handle. The canvas only asks: `isValidConnection` refuses a duplicate, and `onConnect` is where the app adds the edge.",
	capture: { align: "stretch", flow: true },
};

const NODES = [
	{ id: "trigger", title: "Trigger", x: 0, y: 60 },
	{ id: "filter", title: "Filter", x: 230, y: 0 },
	{ id: "notify", title: "Notify", x: 230, y: 140 },
] as const;

function keyOf(connection: FlowConnection): string {
	return `${connection.source}->${connection.target}`;
}

export function Demo(): ReactElement {
	const [edges, setEdges] = useState<FlowConnection[]>([{ source: "trigger", target: "filter" }]);
	const isValidConnection = (connection: FlowConnection) => !edges.some((edge) => keyOf(edge) === keyOf(connection));

	return (
		<Flow
			className="h-80 rounded-lg"
			fitViewOnMount
			isValidConnection={isValidConnection}
			onConnect={(connection) => setEdges((current) => [...current, connection])}
			testID="flow-connect"
		>
			<Flow.Background />
			{NODES.map((node) => (
				<Flow.Node id={node.id} key={node.id} position={{ x: node.x, y: node.y }}>
					<Card className="w-40" size="sm">
						<Card.Header>
							<Card.Title>{node.title}</Card.Title>
						</Card.Header>
					</Card>
					<Flow.Handle id="in" side="left" testID={`flow-handle-${node.id}-in`} type="target" />
					<Flow.Handle id="out" side="right" testID={`flow-handle-${node.id}-out`} />
				</Flow.Node>
			))}
			{edges.map((edge) => (
				<Flow.Edge from={`${edge.source}.out`} hasArrow key={keyOf(edge)} to={`${edge.target}.in`} />
			))}
		</Flow>
	);
}
