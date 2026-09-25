import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Meter, type MeterThreshold } from "@delacour/react-native-ui/meter";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Password strength",
	note: "Four whole blocks, because a password is not seventy percent strong. Any score above zero lights at least one block, thresholds turn it from destructive to success, and valueLabel speaks the word rather than a number — on screen and to the screen reader alike.",
	capture: { align: "stretch" },
	keyboardAware: true,
};

const THRESHOLDS: readonly MeterThreshold[] = [
	{ color: "destructive", from: 1 },
	{ color: "warning", from: 2 },
	{ color: "success", from: 3 },
];

const WORDS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

/** A toy score, 0–4: length, then a point each for case, digits and symbols. */
function score(password: string): number {
	if (password.length < 6) return password.length === 0 ? 0 : 1;
	let points = 1;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
	if (/\d/.test(password)) points += 1;
	if (/[^a-zA-Z\d]/.test(password) && password.length >= 10) points += 1;
	return Math.min(4, points);
}

export function Demo(): ReactElement {
	const [password, setPassword] = useState("Harbour7");
	const strength = score(password);

	return (
		<Field>
			<Field.Label>New password</Field.Label>
			<Input
				autoCapitalize="none"
				autoCorrect={false}
				onChangeText={setPassword}
				placeholder="Type a password"
				secureTextEntry
				testID="meter-password-input"
				value={password}
			/>
			<Meter
				className="mt-2"
				maxValue={4}
				segments={4}
				testID="meter-password"
				thresholds={THRESHOLDS}
				value={strength}
				valueLabel={WORDS[strength]}
			>
				<Meter.Header>
					<Meter.Label>Strength</Meter.Label>
					<Meter.Output testID="meter-password-output" />
				</Meter.Header>
				<Meter.Segments />
			</Meter>
		</Field>
	);
}
