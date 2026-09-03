import { Field } from "delacour-react-native-ui/field";
import { INPUT_VARIANTS, Input } from "delacour-react-native-ui/input";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "At rest",
	caption:
		"`primary` sits on a card with a visible border; `secondary` is a filled field with none, for a surface that already has one.",
	capture: { align: "stretch", hero: true },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [value, setValue] = useState("");

	return (
		<View className="gap-4">
			{INPUT_VARIANTS.map((variant) => (
				<Field key={variant}>
					<Field.Label>{variant}</Field.Label>
					<Input
						onChangeText={setValue}
						placeholder="Type here"
						testID={`input-${variant}`}
						value={value}
						variant={variant}
					/>
				</Field>
			))}
		</View>
	);
}
