import { Sketch } from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Draw",
	caption:
		"A finger is the pen. The stroke is smoothed and drawn on the UI thread as it goes, and a tap leaves a dot the width of the pen.",
};

export function Demo(): ReactElement {
	return (
		<Sketch className="h-120">
			<Sketch.Canvas testID="sketch-canvas" />
			<Sketch.Toolbar>
				<Sketch.Tool testID="sketch-tool-pen" tool="pen" />
				<Sketch.Tool testID="sketch-tool-eraser" tool="eraser" />
				<Sketch.Swatches />
				<Sketch.Undo testID="sketch-undo" />
			</Sketch.Toolbar>
		</Sketch>
	);
}
