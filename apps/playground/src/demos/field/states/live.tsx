import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Live",
	caption: "Type an `@`. Everything leaves danger together, and the error removes itself.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("not-an-email");
	const isInvalid = !email.includes("@");

	return (
		<Field isInvalid={isInvalid}>
			<Field.Label>Email</Field.Label>
			<Input autoCapitalize="none" inputMode="email" onChangeText={setEmail} testID="email" value={email} />
			<Field.Description>We use this for receipts.</Field.Description>
			<Field.Error>{isInvalid ? "Enter a valid email address." : undefined}</Field.Error>
		</Field>
	);
}
