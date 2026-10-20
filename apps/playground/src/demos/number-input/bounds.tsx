import { NumberInput, type NumberInputValue } from "@delacour/react-native-ui/number-input";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bounds",
	caption:
		"`min` and `max` hold the value in range. The minus dims at the floor and the plus at the ceiling, and a typed 40 comes back as 4 on blur.",
	keyboardAware: true,
	capture: { flow: true },
};

const MIN = 1;
const MAX = 4;

export function Demo(): ReactElement {
	const [guests, setGuests] = useState<NumberInputValue>(MIN);
	const label = guests === MIN ? "At the minimum" : guests === MAX ? "At the maximum" : "In range";
	return (
		<View className="w-48 gap-2">
			<NumberInput accessibilityLabel="Guests" max={MAX} min={MIN} onValueChange={setGuests} value={guests}>
				<NumberInput.Decrement testID="bounds-decrement" />
				<NumberInput.Field testID="bounds-field" />
				<NumberInput.Increment testID="bounds-increment" />
			</NumberInput>
			<Text.Caption color="muted">{label}</Text.Caption>
		</View>
	);
}
