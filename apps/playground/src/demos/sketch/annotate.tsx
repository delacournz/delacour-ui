import { Button } from "@delacour/react-native-ui/button";
import { Sketch, type SketchHandle } from "@delacour/react-native-ui/sketch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Annotate",
	caption:
		"`Sketch.Canvas` children are painted under the marks, so the drawing goes over whatever is there — a receipt here, a photo in an app. The handle's `toSVG` exports only the marks.",
	align: "stretch",
};

const LINES = [
	["Flat white", "5.50"],
	["Almond croissant", "6.00"],
	["Sparkling water", "4.00"],
] as const;

export function Demo(): ReactElement {
	const sketch = useRef<SketchHandle>(null);
	const [exported, setExported] = useState<number | null>(null);

	return (
		<View className="gap-3">
			<Sketch className="h-110" colors={["destructive", "warning"]} defaultSize={3} ref={sketch}>
				<Sketch.Canvas testID="sketch-canvas">
					<View className="gap-2 p-6">
						<Text.Header>Harbourside Kitchen</Text.Header>
						{LINES.map(([item, price]) => (
							<View className="flex-row justify-between" key={item}>
								<Text.Paragraph>{item}</Text.Paragraph>
								<Text.Paragraph>{price}</Text.Paragraph>
							</View>
						))}
						<View className="flex-row justify-between border-t border-border pt-2">
							<Text.Label>Total</Text.Label>
							<Text.Label>15.50</Text.Label>
						</View>
					</View>
				</Sketch.Canvas>
				<Sketch.Toolbar>
					<Sketch.Tool tool="pen" />
					<Sketch.Tool shape="ellipse" tool="shape" />
					<Sketch.Tool shape="arrow" tool="shape" />
					<Sketch.Swatches />
					<Sketch.Undo />
				</Sketch.Toolbar>
			</Sketch>
			<Button onPress={() => setExported(sketch.current?.toSVG({ background: null }).length ?? 0)} variant="outline">
				<Button.Label>{exported === null ? "Export SVG" : `Exported ${exported} characters`}</Button.Label>
			</Button>
		</View>
	);
}
