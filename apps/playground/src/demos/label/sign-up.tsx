import { Button } from "@delacour/react-native-ui/button";
import { Input } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

type Values = { name: string; email: string; company: string };

type FieldName = keyof Values;

/** Why a value is refused, or `undefined` when it is fine. */
function validate(field: FieldName, value: string): string | undefined {
	switch (field) {
		case "name":
			return value.trim() === "" ? "Enter your name." : undefined;
		case "email":
			if (value.trim() === "") return "Enter your email.";
			return value.includes("@") ? undefined : "Enter a valid email address.";
		case "company":
			return undefined;
	}
}

export const meta: DemoMeta = {
	title: "Sign-up form",
	caption:
		"Two required fields and an optional one. Tap Create account with them empty and both labels turn destructive with their fields; each clears as soon as its value is acceptable.",
	keyboardAware: true,
	capture: { align: "stretch", hero: true },
};

function Row({
	children,
	error,
	isRequired = false,
	label,
}: {
	children: ReactElement;
	error: string | undefined;
	isRequired?: boolean;
	label: string;
}): ReactElement {
	return (
		<View className="gap-1.5">
			<Label isInvalid={error !== undefined} isRequired={isRequired}>
				{label}
			</Label>
			{children}
			{error === undefined ? null : (
				<Text.Caption accessibilityLiveRegion="polite" color="destructive" role="alert">
					{error}
				</Text.Caption>
			)}
		</View>
	);
}

export function Demo(): ReactElement {
	const [values, setValues] = useState<Values>({ name: "", email: "", company: "" });
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isDone, setIsDone] = useState(false);

	const errorFor = (field: FieldName): string | undefined => (isSubmitted ? validate(field, values[field]) : undefined);

	const change = (field: FieldName) => (value: string) => {
		setValues((current) => ({ ...current, [field]: value }));
		setIsDone(false);
	};

	const submit = () => {
		setIsSubmitted(true);
		setIsDone(validate("name", values.name) === undefined && validate("email", values.email) === undefined);
	};

	return (
		<View className="gap-5">
			<Row error={errorFor("name")} isRequired label="Full name">
				<Input
					isInvalid={errorFor("name") !== undefined}
					onChangeText={change("name")}
					placeholder="Ada Lovelace"
					testID="name"
					textContentType="name"
					value={values.name}
				/>
			</Row>
			<Row error={errorFor("email")} isRequired label="Email">
				<Input
					autoCapitalize="none"
					inputMode="email"
					isInvalid={errorFor("email") !== undefined}
					onChangeText={change("email")}
					placeholder="you@example.com"
					testID="email"
					textContentType="emailAddress"
					value={values.email}
				/>
			</Row>
			<Row error={undefined} label="Company">
				<Input
					onChangeText={change("company")}
					placeholder="Analytical Engines Ltd"
					testID="company"
					value={values.company}
				/>
			</Row>
			<Button onPress={submit} testID="submit">
				{isDone ? "Account created" : "Create account"}
			</Button>
		</View>
	);
}
