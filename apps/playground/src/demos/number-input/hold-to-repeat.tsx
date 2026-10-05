import { NumberInput } from "@delacour/react-native-ui/number-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hold to repeat",
	caption:
		"Hold a stepper: it repeats after 400ms, speeds up, and from the 25th repeat moves ten steps at a time. It stops at the limit with one light tap.",
	keyboardAware: true,
	capture: { flow: "number-input/hold-to-repeat" },
};

export function Demo(): ReactElement {
	return (
		<NumberInput accessibilityLabel="Distance" className="w-48" defaultValue={0} max={1000} min={0}>
			<NumberInput.Decrement testID="repeat-decrement" />
			<NumberInput.Field testID="repeat-field" />
			<NumberInput.Increment testID="repeat-increment" />
		</NumberInput>
	);
}
