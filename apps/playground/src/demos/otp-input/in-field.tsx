import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { OtpInput, type OtpInputRef } from "@delacour/react-native-ui/otp-input";
import { playHaptic } from "@delacour/react-native-ui/pressable";
import { type ReactElement, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a field",
	caption:
		"The label names the field for a screen reader and focuses it when tapped. The code is checked the moment the last cell fills — 123456 is right, anything else turns the field invalid with an error haptic.",
	keyboardAware: true,
	align: "stretch",
};

const CORRECT_CODE = "123456";

type Status = "idle" | "wrong" | "verified";

const DESCRIPTIONS: Record<Exclude<Status, "wrong">, string> = {
	idle: "We sent a code to +64 21 555 0192.",
	verified: "Verified.",
};

export function Demo(): ReactElement {
	const [code, setCode] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const ref = useRef<OtpInputRef>(null);

	return (
		<View className="gap-4">
			<Field isInvalid={status === "wrong"}>
				<Field.Label>Verification code</Field.Label>
				<OtpInput
					groupSize={3}
					onComplete={(value) => {
						const isRight = value === CORRECT_CODE;
						setStatus(isRight ? "verified" : "wrong");
						if (!isRight) playHaptic("error");
					}}
					onValueChange={(value) => {
						setCode(value);
						if (status !== "idle") setStatus("idle");
					}}
					ref={ref}
					testID="otp-field"
					value={code}
				/>
				{status === "wrong" ? (
					<Field.Error>That code is incorrect.</Field.Error>
				) : (
					<Field.Description>{DESCRIPTIONS[status]}</Field.Description>
				)}
			</Field>
			<Button
				onPress={() => {
					ref.current?.clear();
					ref.current?.focus();
				}}
				size="sm"
				testID="otp-field-clear"
				variant="secondary"
			>
				<Button.Label>Clear</Button.Label>
			</Button>
		</View>
	);
}
