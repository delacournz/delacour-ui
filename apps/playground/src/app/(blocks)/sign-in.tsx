import { Button } from "@delacour/react-native-ui/button";
import { Card } from "@delacour/react-native-ui/card";
import { Field } from "@delacour/react-native-ui/field";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconEmail1, IconEyeOpen, IconEyeSlash, IconLock } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useEffect, useState } from "react";
import { Keyboard, View } from "react-native";
import { canSubmitSignIn, emailError, passwordError } from "@/blocks/sign-in";
import { BlockScreen } from "@/components/block-screen";

const SUBMIT_MS = 1000;

/**
 * Sign in: two etched fields in an etched card, and the primary etched button
 * pinned in the footer so it rides above the keyboard.
 *
 * Errors show only once a field has content, and the button stays disabled until
 * both are valid. Submitting is a timer standing in for a request, and success
 * moves on to the code screen.
 */
export default function SignInBlock(): ReactElement {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isRevealed, setRevealed] = useState(false);
	const [isSubmitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!isSubmitting) return;
		const timer = setTimeout(() => {
			setSubmitting(false);
			router.push("/otp");
		}, SUBMIT_MS);
		return () => clearTimeout(timer);
	}, [isSubmitting, router]);

	const emailMessage = emailError(email);
	const passwordMessage = passwordError(password);

	const submit = () => {
		Keyboard.dismiss();
		setSubmitting(true);
	};

	return (
		<BlockScreen
			footer={
				<Button
					haptic="medium"
					isDisabled={!canSubmitSignIn(email, password)}
					isLoading={isSubmitting}
					material="etched"
					onPress={submit}
					testID="sign-in-submit"
				>
					Sign in
				</Button>
			}
			keyboardAware
			subtitle="Block"
			title="Sign in"
		>
			<View className="gap-1">
				<Text.Display accessibilityRole="header" className="font-semibold text-[28px] leading-[34px]">
					Welcome back
				</Text.Display>
				<Text.Paragraph className="text-muted-foreground">Use the email you registered with.</Text.Paragraph>
			</View>

			<Card material="etched">
				<Card.Content>
					<Field isInvalid={emailMessage !== undefined}>
						<Field.Label>Email</Field.Label>
						<Input.Group variant="etched">
							<Input.Group.Prefix>
								<Icon icon={IconEmail1} />
							</Input.Group.Prefix>
							<Input
								autoCapitalize="none"
								autoComplete="email"
								inputMode="email"
								onChangeText={setEmail}
								placeholder="you@example.com"
								testID="sign-in-email"
								textContentType="emailAddress"
								value={email}
							/>
						</Input.Group>
						<Field.Error>{emailMessage}</Field.Error>
					</Field>
					<Field isInvalid={passwordMessage !== undefined}>
						<Field.Label>Password</Field.Label>
						<Input.Group variant="etched">
							<Input.Group.Prefix>
								<Icon icon={IconLock} />
							</Input.Group.Prefix>
							<Input
								autoCapitalize="none"
								autoComplete="current-password"
								onChangeText={setPassword}
								onSubmitEditing={canSubmitSignIn(email, password) ? submit : undefined}
								placeholder="At least 8 characters"
								returnKeyType="go"
								secureTextEntry={!isRevealed}
								testID="sign-in-password"
								textContentType="password"
								value={password}
							/>
							<Input.Group.Suffix>
								<Button
									accessibilityLabel={isRevealed ? "Hide password" : "Show password"}
									onPress={() => setRevealed((current) => !current)}
									size="icon-sm"
									variant="ghost"
								>
									<Icon icon={isRevealed ? IconEyeSlash : IconEyeOpen} />
								</Button>
							</Input.Group.Suffix>
						</Input.Group>
						<Field.Error>{passwordMessage}</Field.Error>
					</Field>
				</Card.Content>
			</Card>

			<Button size="sm" variant="ghost">
				Forgot your password?
			</Button>
		</BlockScreen>
	);
}
