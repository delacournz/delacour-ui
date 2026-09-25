import { Button } from "@delacour/react-native-ui/button";
import { Card } from "@delacour/react-native-ui/card";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sign in",
	caption:
		"A form card as an app would write it. The email is validated as you type, the submit button shows a loading state, and the remember-me switch is uncontrolled.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

const SUBMIT_MS = 1200;

export function Demo(): ReactElement {
	const [email, setEmail] = useState("");
	const [isSubmitting, setSubmitting] = useState(false);
	const [isSignedIn, setSignedIn] = useState(false);

	const isEmailInvalid = email.length > 0 && !email.includes("@");

	useEffect(() => {
		if (!isSubmitting) return;
		const timer = setTimeout(() => {
			setSubmitting(false);
			setSignedIn(true);
		}, SUBMIT_MS);
		return () => clearTimeout(timer);
	}, [isSubmitting]);

	return (
		<Card testID="card-sign-in">
			<Card.Header>
				<Card.Title>Sign in</Card.Title>
				<Card.Description>Use the email you registered with.</Card.Description>
				<Card.Action>
					<Button size="sm" testID="card-sign-in-register" variant="ghost">
						Register
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<Field isInvalid={isEmailInvalid}>
					<Field.Label>Email</Field.Label>
					<Input
						autoCapitalize="none"
						inputMode="email"
						onChangeText={(value) => {
							setEmail(value);
							setSignedIn(false);
						}}
						placeholder="you@example.com"
						testID="card-sign-in-email"
						textContentType="emailAddress"
						value={email}
					/>
					<Field.Error>{isEmailInvalid ? "Enter a valid email address." : undefined}</Field.Error>
				</Field>
				<View className="flex-row items-center justify-between gap-3">
					<Text.Label>Remember me</Text.Label>
					<Switch accessibilityLabel="Remember me" defaultSelected testID="card-sign-in-remember" />
				</View>
			</Card.Content>
			<Card.Footer variant="band">
				<View className="flex-1 gap-2">
					<Button
						isDisabled={email.length === 0 || isEmailInvalid}
						isLoading={isSubmitting}
						onPress={() => setSubmitting(true)}
						testID="card-sign-in-submit"
					>
						Sign in
					</Button>
					<Text.Caption className="text-center" testID="card-sign-in-status">
						{isSignedIn ? `Signed in as ${email}` : "Not signed in"}
					</Text.Caption>
				</View>
			</Card.Footer>
		</Card>
	);
}
