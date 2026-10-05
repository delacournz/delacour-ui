import { Card } from "@delacour/react-native-ui/card";
import { Flow, type FlowPoint } from "@delacour/react-native-ui/flow";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Groups",
	caption:
		"Drag the group's box and every node in it rides along; `onNodeDragEnd` fires for the group and each rider. `isConfined` keeps a node inside its group, and `isPinned` stops its own drag while it still rides.",
};

const START: Record<string, FlowPoint> = {
	ingest: { x: 0, y: 0 },
	fetch: { x: 20, y: 44 },
	parse: { x: 20, y: 124 },
	report: { x: 320, y: 70 },
};

export function Demo(): ReactElement {
	const [positions, setPositions] = useState(START);
	const move = (id: string, position: FlowPoint) => setPositions((current) => ({ ...current, [id]: position }));
	const at = (id: string): FlowPoint => positions[id] ?? { x: 0, y: 0 };

	return (
		<Flow className="h-96 rounded-lg" fitViewOnMount onNodeDragEnd={move} testID="flow-groups">
			<Flow.Background variant="lines" />
			<Flow.Group
				id="ingest"
				label="Ingest"
				position={at("ingest")}
				size={{ height: 200, width: 220 }}
				testID="flow-group-ingest"
			>
				<Flow.Node id="fetch" isConfined position={at("fetch")}>
					<Card className="w-44" size="sm">
						<Card.Header>
							<Card.Title>Fetch</Card.Title>
						</Card.Header>
					</Card>
					<Flow.Handle side="bottom" />
				</Flow.Node>
				<Flow.Node id="parse" isPinned position={at("parse")}>
					<Card className="w-44" size="sm">
						<Card.Header>
							<Card.Title>Parse</Card.Title>
							<Card.Description>Pinned</Card.Description>
						</Card.Header>
					</Card>
					<Flow.Handle id="in" side="top" type="target" />
					<Flow.Handle id="out" side="right" />
				</Flow.Node>
			</Flow.Group>
			<Flow.Node id="report" position={at("report")}>
				<Card className="w-40" size="sm">
					<Card.Header>
						<Card.Title>Report</Card.Title>
					</Card.Header>
				</Card>
				<Flow.Handle side="left" type="target" />
			</Flow.Node>
			<Flow.Edge from="fetch" to="parse.in" variant="smoothstep" />
			<Flow.Edge from="parse.out" hasArrow to="report" />
		</Flow>
	);
}
