import { Badge } from "@delacour/react-native-ui/badge";
import { Flow, type FlowEdgeVariant } from "@delacour/react-native-ui/flow";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Edge variants",
	caption:
		"`bezier` bows out of each side, `smoothstep` turns with rounded corners, `step` turns square, and `straight` is a line. A step route stands `gap` off each side before it turns.",
	capture: { align: "stretch" },
};

const VARIANTS: readonly FlowEdgeVariant[] = ["bezier", "smoothstep", "step", "straight"];

export function Demo(): ReactElement {
	return (
		<Flow canPan={false} canZoom={false} className="h-96 rounded-lg" fitViewOnMount testID="flow-edge-variants">
			{VARIANTS.map((variant, index) => (
				<Flow.Node id={`${variant}-a`} isDraggable={false} key={`${variant}-a`} position={{ x: 0, y: index * 90 }}>
					<Badge variant="soft">{variant}</Badge>
				</Flow.Node>
			))}
			{VARIANTS.map((variant, index) => (
				<Flow.Node
					id={`${variant}-b`}
					isDraggable={false}
					key={`${variant}-b`}
					position={{ x: 240, y: index * 90 + 40 }}
				>
					<Badge variant="soft">target</Badge>
				</Flow.Node>
			))}
			{VARIANTS.map((variant) => (
				<Flow.Edge from={`${variant}-a`} hasArrow key={variant} to={`${variant}-b`} variant={variant} />
			))}
		</Flow>
	);
}
