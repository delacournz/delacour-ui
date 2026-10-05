import { buildSketchShapePath, Sketch, type SketchItem, type SketchShape } from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Shapes",
	caption:
		"Eight shapes, drawn by dragging. A line and an arrow follow the drag; the rest fill its bounds, whichever way it runs. A drag under four points draws nothing.",
	align: "stretch",
	capture: { align: "stretch", flow: "sketch/shapes" },
};

function shape(shape: SketchShape, x: number, y: number, size: number, color: string): SketchItem {
	const d = buildSketchShapePath(shape, { x, y }, { x: x + size, y: y + size * 0.8 }, 3) ?? "";
	return { color, d, id: shape, kind: "shape", shape, width: 3 };
}

const SEED = [shape("rectangle", 28, 28, 90, "#3b82f6"), shape("triangle", 230, 250, 90, "#22c55e")];

export function Demo(): ReactElement {
	return (
		<Sketch
			className="h-140"
			defaultColor="primary"
			defaultItems={SEED}
			defaultShape="arrow"
			defaultTool="shape"
			testID="sketch-shapes"
		/>
	);
}
