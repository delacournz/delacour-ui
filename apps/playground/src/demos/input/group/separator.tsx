import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Separator",
	caption: "`Input.Group.Separator` draws a hairline between a decorator and the field — vertical in the row.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Price</Field.Label>
				<Input.Group size="lg">
					<Input.Group.Prefix>$</Input.Group.Prefix>
					<Input.Group.Separator />
					<Input accessibilityLabel="Price, New Zealand dollars" inputMode="decimal" placeholder="0.00" />
					<Input.Group.Separator />
					<Input.Group.Suffix>NZD</Input.Group.Suffix>
				</Input.Group>
			</Field>
			<Field>
				<Field.Label>Weight</Field.Label>
				<Input.Group>
					<Input accessibilityLabel="Weight, kilograms" inputMode="decimal" placeholder="0" />
					<Input.Group.Separator />
					<Input.Group.Suffix>kg</Input.Group.Suffix>
				</Input.Group>
			</Field>
		</View>
	);
}
