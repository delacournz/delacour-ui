import { INPUT_SIZES, Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiline",
	caption:
		"A multiline field turns its height into a floor. It starts exactly as tall as a single-line one at the same size and grows with the text instead of clipping it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_SIZES.map((size) => (
				<Input key={size} multiline placeholder={`Notes (${size})`} size={size} />
			))}
		</View>
	);
}
