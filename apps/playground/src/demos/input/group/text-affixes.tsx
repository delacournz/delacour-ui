import { Field } from "delacour-react-native-ui/field";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Text affixes",
	caption:
		"A bare string is wrapped in a `Text` that inherits the affix treatment, so a currency symbol or a domain is written as itself rather than as markup.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Currency</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>$</Input.Group.Prefix>
					<Input inputMode="decimal" placeholder="0.00" />
					<Input.Group.Suffix>NZD</Input.Group.Suffix>
				</Input.Group>
			</Field>
			<Field>
				<Field.Label>Domain</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>https://</Input.Group.Prefix>
					<Input autoCapitalize="none" placeholder="example" />
					<Input.Group.Suffix>.com</Input.Group.Suffix>
				</Input.Group>
			</Field>
		</View>
	);
}
