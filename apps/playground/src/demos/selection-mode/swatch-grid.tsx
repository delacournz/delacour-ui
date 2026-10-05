import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Swatch grid",
	caption:
		"`columns={5}` with the `ring` indicator: the ring draws round the swatch with a gap, and a check badge sits at its top end. `ringClassName` rounds it to match.",
	capture: { align: "stretch", flow: "selection-mode/swatch-grid" },
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
	{ id: "zinc", label: "Zinc", hex: "#71717a" },
] as const;

export function Demo(): ReactElement {
	const [selected, setSelected] = useState<string[]>(["amber", "sky"]);

	return (
		<SelectionMode className="flex-none gap-3" isActive onSelectedChange={setSelected} selected={selected}>
			<SelectionMode.Group columns={5} label="Palette">
				{SWATCHES.map((swatch) => (
					<SelectionMode.Item
						accessibilityLabel={swatch.label}
						indicator="ring"
						key={swatch.id}
						ringClassName="rounded-full"
						testID={`swatch-${swatch.id}`}
						value={swatch.id}
					>
						<View className="aspect-square rounded-full" style={{ backgroundColor: swatch.hex }} />
					</SelectionMode.Item>
				))}
			</SelectionMode.Group>
			<Text.Caption color="muted">{`${selected.length} colours in the palette`}</Text.Caption>
		</SelectionMode>
	);
}
