import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Signature, type SignatureValue } from "@delacour/react-native-ui/signature";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"Inside a `Field` the pad takes its label as its name and its invalid state as a destructive border. Submit with nothing drawn to see it; the error clears with the first stroke.",
	capture: { align: "stretch", flow: "signature/in-field" },
};

export function Demo(): ReactElement {
	const [signature, setSignature] = useState<SignatureValue | null>(null);
	const [submitted, setSubmitted] = useState(true);
	const isInvalid = submitted && signature === null;

	return (
		<View className="gap-4">
			<Field isInvalid={isInvalid}>
				<Field.Label>Signature</Field.Label>
				<Signature onValueChange={setSignature}>
					<Signature.Pad testID="signature-field-pad" />
					<Signature.Toolbar>
						<Signature.Undo />
						<Signature.Clear testID="signature-field-clear" />
					</Signature.Toolbar>
				</Signature>
				<Field.Error>{isInvalid ? "Please sign to accept the delivery" : undefined}</Field.Error>
			</Field>
			<Button onPress={() => setSubmitted(true)} testID="signature-submit">
				<Button.Label>Accept delivery</Button.Label>
			</Button>
		</View>
	);
}
