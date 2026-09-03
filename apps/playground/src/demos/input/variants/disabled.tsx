import { Field } from "delacour-react-native-ui/field";
import { INPUT_VARIANTS, Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption: "`isDisabled` fades the box and blocks editing — the field cannot be focused at all.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_VARIANTS.map((variant) => (
				<Field key={variant}>
					<Field.Label>{variant}</Field.Label>
					<Input defaultValue="Locked" isDisabled variant={variant} />
				</Field>
			))}
		</View>
	);
}
