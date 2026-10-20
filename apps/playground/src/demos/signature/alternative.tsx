import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Signature } from "@delacour/react-native-ui/signature";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Type instead",
	caption:
		"Not everyone can trace a path with a finger, and no accessibility label changes that. `onRequestAlternative` adds a link that hands off to a typed name — offer it on every pad.",
	keyboardAware: true,
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	const [isTyping, setIsTyping] = useState(false);

	if (isTyping) {
		return (
			<View className="gap-4">
				<Field>
					<Field.Label>Type your full name</Field.Label>
					<Input autoCapitalize="words" autoComplete="name" placeholder="Full name" testID="signature-typed-name" />
					<Field.Description>Typing your name has the same effect as signing.</Field.Description>
				</Field>
				<Button onPress={() => setIsTyping(false)} testID="signature-draw-instead" variant="ghost">
					<Button.Label>Draw instead</Button.Label>
				</Button>
			</View>
		);
	}

	return (
		<Field>
			<Field.Label>Signature</Field.Label>
			<Signature onRequestAlternative={() => setIsTyping(true)}>
				<Signature.Pad testID="signature-alternative-pad" />
				<Signature.Toolbar>
					<Signature.Alternative testID="signature-alternative" />
					<Signature.Undo />
					<Signature.Clear />
				</Signature.Toolbar>
			</Signature>
		</Field>
	);
}
