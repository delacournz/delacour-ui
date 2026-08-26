import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Caret and selection",
	caption:
		"`selectionColorClassName` drives both the caret and the selection highlight. Tap a field and select the text to see it.",
	keyboardAware: true,
};

const SELECTION_ACCENTS = ["accent-primary", "accent-info", "accent-success", "accent-warning"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{SELECTION_ACCENTS.map((accent) => (
				<Field key={accent}>
					<Field.Label>{accent}</Field.Label>
					<Input defaultValue="Select this text" selectionColorClassName={accent} testID={accent} />
				</Field>
			))}
		</View>
	);
}
