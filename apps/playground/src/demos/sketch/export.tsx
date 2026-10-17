import { Button } from "@delacour/react-native-ui/button";
import { Sketch, type SketchHandle } from "@delacour/react-native-ui/sketch";
import { type ReactElement, useRef, useState } from "react";
import { Image, View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Export",
	caption:
		"The handle's `toPNG` renders the marks off screen at the screen's pixel ratio and hands back base64 — on the theme's background, or transparent with `background: null`.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const sketch = useRef<SketchHandle>(null);
	const [png, setPng] = useState<string | null>(null);

	return (
		<View className="gap-3">
			<Sketch className="h-80" ref={sketch}>
				<Sketch.Canvas testID="sketch-canvas" />
				<Sketch.Toolbar>
					<Sketch.Tool testID="sketch-tool-pen" tool="pen" />
					<Sketch.Tool testID="sketch-tool-eraser" tool="eraser" />
					<Sketch.Swatches />
					<Sketch.Undo testID="sketch-undo" />
				</Sketch.Toolbar>
			</Sketch>
			<Button onPress={() => setPng(sketch.current?.toPNG() ?? null)} testID="sketch-export-png" variant="outline">
				<Button.Label>Export PNG</Button.Label>
			</Button>
			{png ? (
				<Image
					className="h-40 rounded-lg border border-border"
					resizeMode="contain"
					source={{ uri: `data:image/png;base64,${png}` }}
					testID="sketch-export-image"
				/>
			) : null}
		</View>
	);
}
