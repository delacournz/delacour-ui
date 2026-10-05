import { Select } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single",
	caption:
		"A field-shaped trigger over a bottom sheet of options. A pick closes the sheet and the trigger reads the chosen label; the box is Input's own, so a select sits level with a text field beside it.",
};

export function Demo(): ReactElement {
	const [fruit, setFruit] = useState<string | null>("kiwifruit");

	return (
		<Select onValueChange={setFruit} placeholder="Choose a fruit" testID="select-single" title="Fruit" value={fruit}>
			<Select.Item label="Apple" value="apple" />
			<Select.Item label="Feijoa" value="feijoa" />
			<Select.Item description="Green or gold" label="Kiwifruit" value="kiwifruit" />
			<Select.Item label="Tamarillo" value="tamarillo" />
			<Select.Item isDisabled label="Durian" value="durian" />
		</Select>
	);
}
