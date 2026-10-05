import { Sketch } from "@delacour/react-native-ui/sketch";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	caption:
		"`colors` takes theme tokens and literals together. A token swatch follows the theme; the ink it lays down does not — each mark keeps the colour it was drawn in.",
};

const COLORS = ["foreground", "primary", "#ec4899", "#8b5cf6", "#14b8a6"] as const;

export function Demo(): ReactElement {
	return (
		<Sketch className="h-80" colors={COLORS} defaultColor="#ec4899" defaultSize={8}>
			<Sketch.Canvas testID="sketch-canvas" />
			<Sketch.Toolbar>
				<Sketch.Swatches testID="sketch-swatches" />
				<Sketch.Size className="min-w-24 flex-1" />
			</Sketch.Toolbar>
		</Sketch>
	);
}
