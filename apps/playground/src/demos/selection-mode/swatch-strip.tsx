import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import { Slider } from "@delacour/react-native-ui/slider";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swatch strip",
	caption:
		"`isHorizontal` lays the items out in one scrolling row, `itemWidth` wide, with room round each for the ring. A slider underneath sets how strongly the picks apply.",
};

const SWATCHES = [
	{ id: "flame", label: "Flame", hex: "#ef4444" },
	{ id: "amber", label: "Amber", hex: "#f59e0b" },
	{ id: "lime", label: "Lime", hex: "#84cc16" },
	{ id: "emerald", label: "Emerald", hex: "#10b981" },
	{ id: "teal", label: "Teal", hex: "#14b8a6" },
	{ id: "sky", label: "Sky", hex: "#0ea5e9" },
	{ id: "indigo", label: "Indigo", hex: "#6366f1" },
	{ id: "violet", label: "Violet", hex: "#8b5cf6" },
	{ id: "pink", label: "Pink", hex: "#ec4899" },
] as const;

export function Demo(): ReactElement {
	const [strength, setStrength] = useState(60);

	return (
		<SelectionMode className="flex-none gap-4" defaultSelected={["teal"]} isActive>
			<SelectionMode.Group isHorizontal itemWidth={40} label="Tint">
				{SWATCHES.map((swatch) => (
					<SelectionMode.Item
						accessibilityLabel={swatch.label}
						indicator="ring"
						key={swatch.id}
						ringClassName="rounded-full"
						testID={`strip-${swatch.id}`}
						value={swatch.id}
					>
						<View className="size-10 rounded-full" style={{ backgroundColor: swatch.hex }} />
					</SelectionMode.Item>
				))}
			</SelectionMode.Group>
			<Slider onChange={(next) => setStrength(next as number)} value={strength}>
				<View className="flex-row items-center justify-between">
					<Text.Label>Strength</Text.Label>
					<Slider.Output />
				</View>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
		</SelectionMode>
	);
}
