import { Badge } from "@delacour/react-native-ui/badge";
import { Flow } from "@delacour/react-native-ui/flow";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Animated edges",
	caption:
		"`isAnimated` marches an edge's dashes toward its target. It is decorative, so it holds still under reduce motion.",
	capture: { align: "stretch", flow: "flow/animated-edges" },
};

export function Demo(): ReactElement {
	return (
		<Flow canPan={false} canZoom={false} className="h-64 rounded-lg" fitViewOnMount testID="flow-animated">
			<Flow.Node id="queue" isDraggable={false} position={{ x: 0, y: 60 }}>
				<Badge variant="soft">queue</Badge>
			</Flow.Node>
			<Flow.Node id="worker" isDraggable={false} position={{ x: 220, y: 0 }}>
				<Badge variant="soft">worker</Badge>
			</Flow.Node>
			<Flow.Node id="dead" isDraggable={false} position={{ x: 220, y: 120 }}>
				<Badge variant="soft">dead letter</Badge>
			</Flow.Node>
			<Flow.Edge color="primary" from="queue" hasArrow isAnimated to="worker" />
			<Flow.Edge color="destructive" from="queue" hasArrow isDashed to="dead" />
		</Flow>
	);
}
