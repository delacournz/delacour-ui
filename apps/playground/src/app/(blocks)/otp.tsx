import { Button } from "@delacour/react-native-ui/button";
import { Input } from "@delacour/react-native-ui/input";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useRef, useState } from "react";
import { Keyboard, type TextInput, View } from "react-native";
import { applyOtpInput, isOtpComplete, OTP_LENGTH } from "@/blocks/otp";
import { BlockScreen } from "@/components/block-screen";

const BOXES = Array.from({ length: OTP_LENGTH }, (_, index) => index);

/**
 * Verify code: six etched boxes that behave as one field.
 *
 * Typing a digit advances, clearing steps back, and a paste or the OS's autofill
 * (`oneTimeCode`) spreads across all six — the rules are `applyOtpInput`, which
 * is pure and tested. The library has no one-time-code input, so this composes
 * six `Input`s; if it earns a component, that is the gap to report.
 */
export default function OtpBlock(): ReactElement {
	const router = useRouter();
	const [digits, setDigits] = useState<readonly string[]>(() => BOXES.map(() => ""));
	const refs = useRef<(TextInput | null)[]>([]);

	const change = (index: number, raw: string) => {
		const next = applyOtpInput(digits, index, raw);
		setDigits(next.digits);
		if (next.focus !== index) refs.current[next.focus]?.focus();
	};

	const verify = () => {
		Keyboard.dismiss();
		router.back();
	};

	return (
		<BlockScreen
			footer={
				<Button
					haptic="medium"
					isDisabled={!isOtpComplete(digits)}
					material="etched"
					onPress={verify}
					testID="otp-verify"
				>
					Verify
				</Button>
			}
			keyboardAware
			subtitle="Block"
			title="Verify code"
		>
			<View className="gap-1">
				<Text.Display accessibilityRole="header" className="font-semibold text-[28px] leading-[34px] tracking-tight">
					Check your email
				</Text.Display>
				<Text.Caption color="muted">We sent a six-digit code to rawiri@delacour.co.nz.</Text.Caption>
			</View>

			<View accessibilityLabel="One-time code" className="flex-row gap-2">
				{BOXES.map((index) => (
					<View className="flex-1" key={index}>
						<Input
							accessibilityLabel={`Digit ${index + 1}`}
							autoFocus={index === 0}
							className="text-center"
							inputMode="numeric"
							maxLength={index === 0 ? OTP_LENGTH : 1}
							onChangeText={(value) => change(index, value)}
							ref={(node) => {
								refs.current[index] = node;
							}}
							selectTextOnFocus
							testID={`otp-${index}`}
							textContentType="oneTimeCode"
							value={digits[index] ?? ""}
							variant="etched"
						/>
					</View>
				))}
			</View>

			<View className="items-start gap-1">
				<Text.Kicker>Did not get it?</Text.Kicker>
				<Button size="sm" variant="ghost">
					Send a new code
				</Button>
			</View>
		</BlockScreen>
	);
}
