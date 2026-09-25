import { Steps } from "@delacour/react-native-ui/steps";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading, invalid, disabled and skipped",
	caption:
		"A spinner outranks a cross, which outranks a check. `completed={false}` leaves a passed optional step looking unfinished, and a disabled step fades and takes no press.",
	capture: { align: "stretch" },
};

/** One labelled switch. A module-scope helper, so the demo reads as the stepper and its controls. */
function Toggle({
	label,
	isSelected,
	onChange,
	testID,
}: {
	label: string;
	isSelected: boolean;
	onChange: (next: boolean) => void;
	testID: string;
}): ReactElement {
	return (
		<View className="flex-row items-center justify-between">
			<Text.Label>{label}</Text.Label>
			<Switch
				accessibilityLabel={label}
				isSelected={isSelected}
				onSelectedChange={onChange}
				size="sm"
				testID={testID}
			/>
		</View>
	);
}

export function Demo(): ReactElement {
	const [step, setStep] = useState(1);
	const [isLoading, setLoading] = useState(false);
	const [isInvalid, setInvalid] = useState(true);
	const [isDisabled, setDisabled] = useState(true);

	return (
		<View className="gap-6">
			<Steps onValueChange={setStep} orientation="vertical" value={step}>
				<Steps.Item step={0} testID="steps-states-0">
					<Steps.Title>Details</Steps.Title>
					<Steps.Description>Completed.</Steps.Description>
				</Steps.Item>
				<Steps.Item isInvalid={isInvalid} isLoading={isLoading} step={1} testID="steps-states-1">
					<Steps.Title>Verify email</Steps.Title>
					<Steps.Description>{isInvalid ? "The code has expired." : "Waiting for the code."}</Steps.Description>
				</Steps.Item>
				<Steps.Item completed={false} step={2} testID="steps-states-2">
					<Steps.Title>Add-ons</Steps.Title>
					<Steps.Description>Optional — stays unfinished even once passed.</Steps.Description>
				</Steps.Item>
				<Steps.Item isDisabled={isDisabled} step={3} testID="steps-states-3">
					<Steps.Title>Confirm</Steps.Title>
					<Steps.Description>{isDisabled ? "Disabled." : "Available."}</Steps.Description>
				</Steps.Item>
			</Steps>
			<View className="gap-3">
				<Toggle isSelected={isLoading} label="Verify is loading" onChange={setLoading} testID="steps-toggle-loading" />
				<Toggle isSelected={isInvalid} label="Verify is invalid" onChange={setInvalid} testID="steps-toggle-invalid" />
				<Toggle
					isSelected={isDisabled}
					label="Confirm is disabled"
					onChange={setDisabled}
					testID="steps-toggle-disabled"
				/>
			</View>
		</View>
	);
}
