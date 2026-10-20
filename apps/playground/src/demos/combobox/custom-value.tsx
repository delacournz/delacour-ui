import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom values",
	caption:
		"`allowCustomValue` offers what you typed as a value of its own whenever no option says exactly that. The value is the text itself, so it reads back as its own label.",
	capture: { flow: true, frame: "device" },
};

const LABELS = [
	{ label: "Bug", value: "bug" },
	{ label: "Design", value: "design" },
	{ label: "Documentation", value: "documentation" },
	{ label: "Feature", value: "feature" },
	{ label: "Good first issue", value: "good-first-issue" },
] as const;

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * the capture stage hands a `device` demo the full window with no gutter, and
 * the sheet it opens needs the screen to rise over.
 */
export function Demo(): ReactElement {
	const [labels, setLabels] = useState<string[]>(["bug", "Needs triage"]);

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Combobox
				allowCustomValue
				createLabel={(query) => `Create label “${query}”`}
				onValueChange={setLabels}
				options={LABELS}
				placeholder="Add labels"
				selectionMode="multiple"
				testID="combobox-custom"
				title="Labels"
				value={labels}
			/>
		</View>
	);
}
