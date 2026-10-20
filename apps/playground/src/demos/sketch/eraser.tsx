import {
	appendSketchSegment,
	finishSketchPath,
	Sketch,
	type SketchItem,
	startSketchPath,
} from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Eraser",
	caption:
		"The eraser hides the ink under it that was drawn before it. A stroke drawn afterwards over the same spot is left alone, and undo brings the erased ink back.",
	align: "stretch",
	capture: { align: "stretch", flow: true },
};

const COLOURS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"] as const;

function line(id: string, y: number, color: string): SketchItem {
	let path = startSketchPath({ x: 30, y });
	for (let x = 50; x <= 330; x += 20) path = appendSketchSegment(path, { x, y: y + Math.sin(x / 30) * 6 });
	return { color, d: finishSketchPath(path), id, kind: "stroke", width: 10 };
}

const SEED = COLOURS.map((color, index) => line(`line-${index}`, 60 + index * 50, color));

export function Demo(): ReactElement {
	return (
		<Sketch className="h-120" defaultItems={SEED} defaultSize={18} defaultTool="eraser">
			<Sketch.Canvas testID="sketch-canvas" />
			<Sketch.Toolbar>
				<Sketch.Tool testID="sketch-tool-pen" tool="pen" />
				<Sketch.Tool testID="sketch-tool-eraser" tool="eraser" />
				<Sketch.Undo testID="sketch-undo" />
			</Sketch.Toolbar>
		</Sketch>
	);
}
