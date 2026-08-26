import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Separator",
	caption: "Unlabelled it is one full-width rule; labelled it is two rules with the text between them.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<Field.Group>
			<Field>
				<Field.Label>Work email</Field.Label>
				<Input inputMode="email" placeholder="ada@work.example" />
			</Field>
			<Field.Separator />
			<Field>
				<Field.Label>Personal email</Field.Label>
				<Input inputMode="email" placeholder="ada@home.example" />
			</Field>
			<Field.Separator>Or continue with</Field.Separator>
			<Field>
				<Field.Label>Recovery code</Field.Label>
				<Input autoCapitalize="characters" placeholder="XXXX-XXXX" />
			</Field>
		</Field.Group>
	);
}
