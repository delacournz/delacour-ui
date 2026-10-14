import {
	appendSketchSegment,
	buildSketchShapePath,
	finishSketchPath,
	Sketch,
	type SketchItem,
	type SketchPoint,
	startSketchPath,
} from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Default",
	caption:
		"`<Sketch />` on its own: the canvas takes the room and every tool sits under it. Seeded with a small drawing so there is something to erase and undo.",
	align: "stretch",
	capture: { align: "stretch", flow: "sketch/default", hero: true },
};

function stroke(id: string, points: SketchPoint[], color: string, width: number): SketchItem {
	const [first, ...rest] = points;
	let path = startSketchPath(first ?? { x: 0, y: 0 });
	for (const point of rest) path = appendSketchSegment(path, point);
	return { color, d: finishSketchPath(path), id, kind: "stroke", width };
}

const WAVE = Array.from({ length: 24 }, (_, index) => ({ x: 40 + index * 11, y: 210 + Math.sin(index / 2.5) * 28 }));

const SEED: SketchItem[] = [
	{
		color: "#3b82f6",
		d: buildSketchShapePath("ellipse", { x: 60, y: 50 }, { x: 170, y: 150 }) ?? "",
		id: "sun",
		kind: "shape",
		shape: "ellipse",
		width: 4,
	},
	{
		color: "#ef4444",
		d: buildSketchShapePath("arrow", { x: 200, y: 140 }, { x: 290, y: 70 }, 4) ?? "",
		id: "arrow",
		kind: "shape",
		shape: "arrow",
		width: 4,
	},
	stroke("wave", WAVE, "#22c55e", 6),
];

export function Demo(): ReactElement {
	return <Sketch className="h-140" defaultItems={SEED} testID="sketch-default" />;
}
