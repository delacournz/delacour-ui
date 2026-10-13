import { Field } from "@delacour/react-native-ui/field";
import { TagInput } from "@delacour/react-native-ui/tag-input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field, with clear",
	caption:
		"Inside a `Field` the label names the input and a tap on it focuses the box. `isClearable` adds a clear-all control while there is anything to clear.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [labels, setLabels] = useState<string[]>(["bug", "needs-triage", "ios"]);

	return (
		<Field>
			<Field.Label>Labels</Field.Label>
			<TagInput
				isClearable
				onValueChange={setLabels}
				placeholder="Add a label"
				testID="tag-input-clear"
				transform={(raw) => raw.toLowerCase().replace(/\s+/g, "-")}
				value={labels}
			/>
			<Field.Description>Lowercased, spaces become hyphens.</Field.Description>
		</Field>
	);
}
