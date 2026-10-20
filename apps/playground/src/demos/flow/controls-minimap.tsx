import { Card } from "@delacour/react-native-ui/card";
import { Flow } from "@delacour/react-native-ui/flow";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controls and minimap",
	caption:
		"`Flow.Controls` zooms, fits and locks the canvas; `Flow.MiniMap` draws every node and frames the part on screen. Both float above the canvas, unscaled.",
	capture: { align: "stretch", flow: true },
};

const NODES = Array.from({ length: 12 }, (_, index) => ({
	id: `n${index}`,
	x: (index % 4) * 200,
	y: Math.floor(index / 4) * 120 + (index % 2) * 30,
}));

export function Demo(): ReactElement {
	return (
		<Flow className="h-96 rounded-lg" defaultViewport={{ x: 24, y: 24, zoom: 0.9 }} testID="flow-controls">
			<Flow.Background />
			{NODES.map((node) => (
				<Flow.Node id={node.id} key={node.id} position={{ x: node.x, y: node.y }}>
					<Card className="w-36" size="sm">
						<Card.Header>
							<Card.Title>{`Step ${node.id.slice(1)}`}</Card.Title>
						</Card.Header>
					</Card>
				</Flow.Node>
			))}
			{NODES.slice(1).map((node, index) => (
				<Flow.Edge from={`n${index}`} key={node.id} to={node.id} />
			))}
			<Flow.Controls />
			<Flow.MiniMap />
		</Flow>
	);
}
