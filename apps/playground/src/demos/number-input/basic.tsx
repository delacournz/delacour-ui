import { NumberInput } from "@delacour/react-native-ui/number-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption: "Tap a stepper to move by one, hold it to repeat, or tap the number and type one.",
	align: "center",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<NumberInput
			accessibilityLabel="Quantity"
			className="w-48"
			defaultValue={2}
			inputProps={{ testID: "number-input-basic" }}
			min={0}
		/>
	);
}
