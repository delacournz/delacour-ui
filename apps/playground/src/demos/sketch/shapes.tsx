import { Sketch } from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Shapes",
	caption:
		"Eight shapes, drawn by dragging. A line and an arrow follow the drag; the rest fill its bounds, whichever way it runs. A drag under four points draws nothing.",
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<Sketch className="h-140" defaultColor="primary" defaultShape="arrow" defaultTool="shape" testID="sketch-shapes" />
	);
}
