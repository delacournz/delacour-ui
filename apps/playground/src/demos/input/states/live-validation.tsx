import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Live validation",
	caption:
		"Start typing and the field turns destructive until there is an `@` in it. The border, the caret and the selection highlight leave destructive together — one state, not three places that have to be kept in step.",
	keyboardAware: true,
	capture: { align: "stretch", flow: "input/states/live-validation", hero: true },
};

export function Demo(): ReactElement {
	const [email, setEmail] = useState("");
	const isInvalid = email.length > 0 && !email.includes("@");

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
