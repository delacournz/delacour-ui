import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Keyboards",
	caption: "Every `TextInput` prop is inherited — these set nothing but `inputMode`.",
	keyboardAware: true,
};

const KEYBOARDS = [
	{ inputMode: "email", label: "Email", placeholder: "you@example.com" },
	{ inputMode: "numeric", label: "Numeric", placeholder: "1234" },
	{ inputMode: "decimal", label: "Decimal", placeholder: "0.00" },
	{ inputMode: "tel", label: "Telephone", placeholder: "021 555 0100" },
	{ inputMode: "url", label: "URL", placeholder: "https://example.com" },
	{ inputMode: "search", label: "Search", placeholder: "Search" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{KEYBOARDS.map((keyboard) => (
				<Field key={keyboard.inputMode}>
					<Field.Label>{keyboard.label}</Field.Label>
					<Input inputMode={keyboard.inputMode} placeholder={keyboard.placeholder} />
				</Field>
			))}
		</View>
	);
}
