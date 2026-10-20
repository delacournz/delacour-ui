import { Field } from "@delacour/react-native-ui/field";
import { TagInput } from "@delacour/react-native-ui/tag-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Overflow",
	caption:
		"With `allowOverflow` a tag past `max` is accepted, and the box turns invalid with a destructive counter until the list is back under. Remove one to clear it.",
	capture: { align: "stretch", flow: true },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Shortlist</Field.Label>
			<TagInput
				allowOverflow
				defaultValue={["Auckland", "Wellington", "Christchurch", "Dunedin"]}
				max={3}
				showCount
				testID="tag-input-overflow"
			/>
			<Field.Description>Pick three.</Field.Description>
		</Field>
	);
}
