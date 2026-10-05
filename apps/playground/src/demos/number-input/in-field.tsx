import { Field } from "@delacour/react-native-ui/field";
import { NumberInput, type NumberInputValue } from "@delacour/react-native-ui/number-input";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		'Inside a `Field` the label names it to a screen reader and focuses it on tap. With `commitMode="validate"` an out-of-range number is kept and flagged rather than pulled in.',
	keyboardAware: true,
	capture: { align: "stretch" },
};

const MAX = 12;

export function Demo(): ReactElement {
	const [months, setMonths] = useState<NumberInputValue>(14);
	const isInvalid = months !== null && months > MAX;
	return (
		<View className="gap-6">
			<Field>
				<Field.Label>Guests</Field.Label>
				<NumberInput defaultValue={2} max={10} min={1} />
				<Field.Description>Up to 10 guests.</Field.Description>
			</Field>
			<Field isInvalid={isInvalid}>
				<Field.Label>Term in months</Field.Label>
				<NumberInput commitMode="validate" max={MAX} min={1} onValueChange={setMonths} value={months} />
				<Field.Description>Between 1 and 12.</Field.Description>
				<Field.Error>A term runs at most 12 months.</Field.Error>
			</Field>
			<Field isDisabled>
				<Field.Label>Seats</Field.Label>
				<NumberInput defaultValue={4} />
			</Field>
		</View>
	);
}
