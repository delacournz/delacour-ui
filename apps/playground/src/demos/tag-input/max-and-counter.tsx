import { Field } from "@delacour/react-native-ui/field";
import { TagInput } from "@delacour/react-native-ui/tag-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Max and counter",
	caption:
		"`max` caps the list and `showCount` reads it back. Once it is full the field steps aside, so there is nothing to type into that would only be refused.",
	capture: { align: "stretch", flow: "tag-input/max-and-counter" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field>
			<Field.Label>Skills</Field.Label>
			<TagInput
				defaultValue={["Swift", "Kotlin", "React Native"]}
				max={5}
				placeholder="Add a skill"
				showCount
				testID="tag-input-max"
			/>
			<Field.Description>Up to five.</Field.Description>
		</Field>
	);
}
