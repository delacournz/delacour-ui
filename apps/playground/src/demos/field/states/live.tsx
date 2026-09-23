import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Live",
	caption:
		"Start typing and the whole field turns destructive until there is an `@` — then everything leaves together, and the error removes itself.",
	keyboardAware: true,
	capture: { align: "stretch", flow: "field/states/live", hero: true },
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("");
	const isInvalid = email.length > 0 && !email.includes("@");

	return (
		<Field isInvalid={isInvalid}>
			<Field.Label>Email</Field.Label>
			<Input
				autoCapitalize="none"
				inputMode="email"
				onChangeText={setEmail}
				placeholder="you@example.com"
				testID="email"
				value={email}
			/>
			<Field.Description>We use this for receipts.</Field.Description>
			<Field.Error>{isInvalid ? "Enter a valid email address." : undefined}</Field.Error>
		</Field>
	);
}
