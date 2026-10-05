import { Card } from "@delacour/react-native-ui/card";
import { Flow, type FlowPoint } from "@delacour/react-native-ui/flow";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pipeline",
	caption:
		"Nodes are cards placed in graph units; edges name the handles they join and route themselves. Drag a card and its edges follow on the same frame; pinch and pan the canvas.",
};

const STAGES = [
	{ id: "source", title: "Source", description: "Orders API" },
	{ id: "clean", title: "Clean", description: "Drop test orders" },
	{ id: "enrich", title: "Enrich", description: "Join customers" },
	{ id: "warehouse", title: "Warehouse", description: "Nightly load" },
] as const;

const START: Record<string, FlowPoint> = {
	source: { x: 0, y: 80 },
	clean: { x: 220, y: 0 },
	enrich: { x: 220, y: 170 },
	warehouse: { x: 440, y: 80 },
};

export function Demo(): ReactElement {
	const [positions, setPositions] = useState(START);
	const move = (id: string, position: FlowPoint) => setPositions((current) => ({ ...current, [id]: position }));

	return (
		<Flow className="h-96 rounded-lg" fitViewOnMount onNodeDragEnd={move} testID="flow-pipeline">
			<Flow.Background />
			{STAGES.map((stage) => (
				<Flow.Node
					id={stage.id}
					key={stage.id}
					position={positions[stage.id] ?? { x: 0, y: 0 }}
					testID={`flow-node-${stage.id}`}
				>
					<Card className="w-44" size="sm">
						<Card.Header>
							<Card.Title>{stage.title}</Card.Title>
							<Card.Description>{stage.description}</Card.Description>
						</Card.Header>
					</Card>
					<Flow.Handle id="in" side="left" type="target" />
					<Flow.Handle id="out" side="right" />
				</Flow.Node>
			))}
			<Flow.Edge from="source.out" hasArrow to="clean.in" variant="smoothstep" />
			<Flow.Edge from="source.out" hasArrow to="enrich.in" variant="smoothstep" />
			<Flow.Edge from="clean.out" hasArrow to="warehouse.in" variant="smoothstep" />
			<Flow.Edge from="enrich.out" hasArrow to="warehouse.in" variant="smoothstep" />
		</Flow>
	);
}
