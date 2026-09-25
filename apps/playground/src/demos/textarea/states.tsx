import { Field } from "@delacour/react-native-ui/field";
import { Textarea } from "@delacour/react-native-ui/textarea";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "States",
	caption:
		"Invalid comes from the enclosing `Field` — type under twenty characters and the border, caret and error go destructive together. Disabled fades the box; read-only keeps it at full contrast.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const MINIMUM = 20;

export function Demo(): ReactElement {
	const [reason, setReason] = useState("Too short");
	const isInvalid = reason.length > 0 && reason.length < MINIMUM;

	return (
		<View className="gap-4">
			<Field isInvalid={isInvalid}>
				<Field.Label>Invalid</Field.Label>
				<Textarea onChangeText={setReason} rows={2} testID="invalid" value={reason} />
				<Field.Error>{isInvalid ? `At least ${MINIMUM} characters, please.` : undefined}</Field.Error>
			</Field>
			<Field isDisabled>
				<Field.Label>Disabled</Field.Label>
				<Textarea defaultValue="Locked while the order ships." rows={2} testID="disabled" />
			</Field>
			<Field>
				<Field.Label>Read-only</Field.Label>
				<Textarea
					defaultValue="Delivered 25 September, signed for at the door."
					editable={false}
					rows={2}
					testID="read-only"
				/>
			</Field>
		</View>
	);
}
