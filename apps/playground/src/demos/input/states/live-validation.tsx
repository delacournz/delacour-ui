import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Live validation",
	caption:
		"Type an `@`. The border, the caret and the selection highlight leave destructive together — one state, not three places that have to be kept in step.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("not-an-email");
	const isInvalid = !email.includes("@");

	return (
		<Field>
			<Field.Label>Email</Field.Label>
			<Input
				autoCapitalize="none"
				inputMode="email"
				isInvalid={isInvalid}
				onChangeText={setEmail}
				placeholder="you@example.com"
				testID="email"
				value={email}
			/>
		</Field>
	);
}
