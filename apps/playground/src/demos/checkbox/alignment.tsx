import { CHECKBOX_ALIGNMENTS, Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Alignment",
	caption:
		"In a fixed-width column, so the row fill is visible. `end` pushes the box to the far edge — the iOS Settings layout.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof CHECKBOX_ALIGNMENTS)[number], string> = {
	start: "Label after the box",
	end: "Label before the box",
};

export function Demo(): ReactElement {
	return (
		<View className="w-64 gap-3 rounded-lg border border-border p-3">
			{CHECKBOX_ALIGNMENTS.map((alignment) => (
				<Checkbox alignment={alignment} color="primary" defaultChecked key={alignment} testID={`checkbox-${alignment}`}>
					<Checkbox.Label>{LABELS[alignment]}</Checkbox.Label>
				</Checkbox>
			))}
		</View>
	);
}
