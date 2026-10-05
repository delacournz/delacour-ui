import { Select } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single",
	caption:
		"A field-shaped trigger over a bottom sheet of options. A pick closes the sheet and the trigger reads the chosen label; the box is Input's own, so a select sits level with a text field beside it.",
	capture: { flow: "select/single", frame: "device", hero: true },
};

export function Demo(): ReactElement {
	const [fruit, setFruit] = useState<string | null>("kiwifruit");

	// The root fills and centres because this demo is captured as a whole screen:
	// a `device` frame hands it the full window with no insets.
	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Select onValueChange={setFruit} placeholder="Choose a fruit" testID="select-single" title="Fruit" value={fruit}>
				<Select.Item label="Apple" value="apple" />
				<Select.Item label="Feijoa" value="feijoa" />
				<Select.Item description="Green or gold" label="Kiwifruit" value="kiwifruit" />
				<Select.Item label="Tamarillo" value="tamarillo" />
				<Select.Item isDisabled label="Durian" value="durian" />
			</Select>
		</View>
	);
}
