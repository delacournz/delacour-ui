import { NumberInput } from "@delacour/react-native-ui/number-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Currency",
	caption:
		"`formatOptions` formats the number at rest through `Intl`. Focus the field and the currency sign and grouping step aside, leaving the bare number to edit.",
	keyboardAware: true,
	capture: { flow: "number-input/currency" },
};

const NZD: Intl.NumberFormatOptions = { currency: "NZD", style: "currency" };

export function Demo(): ReactElement {
	return (
		<NumberInput
			accessibilityLabel="Price"
			className="w-56"
			defaultValue={1249.5}
			formatOptions={NZD}
			locale="en-NZ"
			min={0}
			precision={2}
			step={0.5}
		>
			<NumberInput.Decrement testID="currency-decrement" />
			<NumberInput.Field />
			<NumberInput.Increment testID="currency-increment" />
		</NumberInput>
	);
}
