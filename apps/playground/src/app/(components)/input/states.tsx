import { Field } from "@delacour/native-ui/field";
import { Input } from "@delacour/native-ui/input";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const KEYBOARDS = [
	{ inputMode: "email", label: "Email", placeholder: "you@example.com" },
	{ inputMode: "numeric", label: "Numeric", placeholder: "1234" },
	{ inputMode: "decimal", label: "Decimal", placeholder: "0.00" },
	{ inputMode: "tel", label: "Telephone", placeholder: "021 555 0100" },
	{ inputMode: "url", label: "URL", placeholder: "https://example.com" },
	{ inputMode: "search", label: "Search", placeholder: "Search" },
] as const;

/**
 * The states a field reports, and the React Native props it passes straight
 * through.
 *
 * `InputProps` extends `TextInputProps`, so everything below the first section
 * is inherited rather than restated — the component adds four props and removes
 * one, and the rest of the platform's surface is untouched.
 */
export default function InputStatesDemo(): ReactElement {
	const [email, setEmail] = useState("not-an-email");
	const isInvalid = !email.includes("@");

	return (
		<GalleryScreen keyboardAware subtitle="Reported and inherited" title="Input states">
			<Section title="Live validation">
				<Text.Caption>
					Type an `@`. The border, the caret and the selection highlight leave danger together — one state, not three
					places that have to be kept in step.
				</Text.Caption>
				<Field>
					<Field.Label>Email</Field.Label>
					<Input
						autoCapitalize="none"
						inputMode="email"
						isInvalid={isInvalid}
						onChangeText={setEmail}
						placeholder="you@example.com"
						value={email}
					/>
				</Field>
			</Section>

			<Section title="Not editable">
				<Text.Caption>
					`isDisabled` fades the field and blocks it; `editable={false}` blocks it at full contrast, for a value that is
					shown rather than withheld.
				</Text.Caption>
				<View className="gap-4">
					<Field>
						<Field.Label>Disabled</Field.Label>
						<Input defaultValue="Cannot be edited" isDisabled />
					</Field>
					<Field>
						<Field.Label>Read-only</Field.Label>
						<Input defaultValue="INV-2026-0041" editable={false} />
					</Field>
				</View>
			</Section>

			<Section title="Secure">
				<Text.Caption>`secureTextEntry` is a `TextInput` prop, passed through untouched.</Text.Caption>
				<Field>
					<Field.Label>Password</Field.Label>
					<Input autoCapitalize="none" defaultValue="hunter2" secureTextEntry textContentType="password" />
				</Field>
			</Section>

			<Section title="Keyboards">
				<Text.Caption>Every `TextInput` prop is inherited — these set nothing but `inputMode`.</Text.Caption>
				<View className="gap-4">
					{KEYBOARDS.map((keyboard) => (
						<Field key={keyboard.inputMode}>
							<Field.Label>{keyboard.label}</Field.Label>
							<Input inputMode={keyboard.inputMode} placeholder={keyboard.placeholder} />
						</Field>
					))}
				</View>
			</Section>
		</GalleryScreen>
	);
}
