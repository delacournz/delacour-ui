import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A control can opt out",
	caption:
		"Nearest wins. Both fields sit in an invalid `Field`; the second names `isInvalid={false}` on the `Input` and stays calm while its label still reports the problem.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field isInvalid>
				<Field.Label>Inherits</Field.Label>
				<Input defaultValue="Turns destructive" />
			</Field>
			<Field isInvalid>
				<Field.Label>Opts out</Field.Label>
				<Input defaultValue="Stays calm" isInvalid={false} />
			</Field>
		</View>
	);
}
