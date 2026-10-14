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
	title: "Colours",
	caption:
		"`colors` takes theme tokens and literals together. A token swatch follows the theme; the ink it lays down does not — each mark keeps the colour it was drawn in.",
	align: "stretch",
	capture: { align: "stretch" },
};

const COLORS = ["foreground", "primary", "#ec4899", "#8b5cf6", "#14b8a6"] as const;

function wave(id: string, y: number, color: string, width: number): SketchItem {
	let path = startSketchPath({ x: 40, y });
	for (let x = 60; x <= 320; x += 20) path = appendSketchSegment(path, { x, y: y + Math.sin(x / 28) * 14 });
	return { color, d: finishSketchPath(path), id, kind: "stroke", width };
}

const SEED = [wave("pink", 60, "#ec4899", 8), wave("violet", 120, "#8b5cf6", 5), wave("teal", 180, "#14b8a6", 11)];

export function Demo(): ReactElement {
	return (
		<Sketch className="h-80" colors={COLORS} defaultColor="#ec4899" defaultItems={SEED} defaultSize={8}>
			<Sketch.Canvas testID="sketch-canvas" />
			<Sketch.Toolbar>
				<Sketch.Swatches testID="sketch-swatches" />
				<Sketch.Size className="min-w-24 flex-1" />
			</Sketch.Toolbar>
		</Sketch>
	);
}
