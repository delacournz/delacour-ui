import { Button } from "@delacour/react-native-ui/button";
import { Field } from "@delacour/react-native-ui/field";
import { Input } from "@delacour/react-native-ui/input";
import { Radio } from "@delacour/react-native-ui/radio";
import { Steps } from "@delacour/react-native-ui/steps";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Checkout",
	caption:
		"A composed flow: the current step's form lives in a `Steps.Panel`, outside the tap target. Continue validates it and saves with a spinner in the indicator; a completed step can be tapped to go back and edit it.",
	keyboardAware: true,
};

/** How long the pretend save takes, so the loading state is visible. */
const SAVE_MS = 900;

export function Demo(): ReactElement {
	const [step, setStep] = useState(0);
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [delivery, setDelivery] = useState("standard");
	const [isSaving, setSaving] = useState(false);
	const [attempted, setAttempted] = useState(-1);

	const isEmailInvalid = attempted === 0 && !email.includes("@");
	const isAddressInvalid = attempted === 1 && address.trim().length === 0;

	const advance = (isValid: boolean) => {
		setAttempted(step);
		if (!isValid) return;
		setSaving(true);
		setTimeout(() => {
			setSaving(false);
			setAttempted(-1);
			setStep((current) => current + 1);
		}, SAVE_MS);
	};

	const reset = () => {
		setStep(0);
		setEmail("");
		setAddress("");
		setAttempted(-1);
	};

	return (
		<Steps isLinear onValueChange={setStep} orientation="vertical" value={step}>
			<Steps.Item isInvalid={isEmailInvalid} isLoading={isSaving && step === 0} step={0} testID="checkout-step-0">
				<Steps.Title>Contact</Steps.Title>
				<Steps.Description>{step > 0 ? email : "Where we send the receipt."}</Steps.Description>
				{step === 0 ? (
					<Steps.Panel className="gap-3 pt-3">
						<Field isInvalid={isEmailInvalid}>
							<Field.Label>Email</Field.Label>
							<Input
								autoCapitalize="none"
								autoCorrect={false}
								inputMode="email"
								onChangeText={setEmail}
								placeholder="you@example.com"
								testID="checkout-email"
								value={email}
							/>
							{isEmailInvalid ? <Field.Error>Enter an email address.</Field.Error> : null}
						</Field>
						<Button
							isLoading={isSaving}
							onPress={() => advance(email.includes("@"))}
							size="sm"
							testID="checkout-continue-0"
						>
							Continue
						</Button>
					</Steps.Panel>
				) : null}
			</Steps.Item>
			<Steps.Item isInvalid={isAddressInvalid} isLoading={isSaving && step === 1} step={1} testID="checkout-step-1">
				<Steps.Title>Delivery</Steps.Title>
				<Steps.Description>{step > 1 ? address : "Where the parcel goes."}</Steps.Description>
				{step === 1 ? (
					<Steps.Panel className="gap-3 pt-3">
						<Field isInvalid={isAddressInvalid}>
							<Field.Label>Address</Field.Label>
							<Input onChangeText={setAddress} placeholder="12 Cuba Street" testID="checkout-address" value={address} />
							{isAddressInvalid ? <Field.Error>Enter a delivery address.</Field.Error> : null}
						</Field>
						<Radio.Group accessibilityLabel="Delivery speed" onSelected={setDelivery} selected={delivery}>
							<Radio testID="checkout-standard" value="standard">
								Standard, free
							</Radio>
							<Radio testID="checkout-express" value="express">
								Express, $9
							</Radio>
						</Radio.Group>
						<Button
							isLoading={isSaving}
							onPress={() => advance(address.trim().length > 0)}
							size="sm"
							testID="checkout-continue-1"
						>
							Continue
						</Button>
					</Steps.Panel>
				) : null}
			</Steps.Item>
			<Steps.Item completed={step > 2} isLoading={isSaving && step === 2} step={2} testID="checkout-step-2">
				<Steps.Title>Review</Steps.Title>
				<Steps.Description>{step > 2 ? "Order placed. Thank you." : "Check it over, then pay."}</Steps.Description>
				{step === 2 ? (
					<Steps.Panel className="gap-3 pt-3">
						<Text.Caption>
							{delivery === "express" ? "Express" : "Standard"} delivery to {address}.
						</Text.Caption>
						<Button isLoading={isSaving} onPress={() => advance(true)} size="sm" testID="checkout-place-order">
							Place order
						</Button>
					</Steps.Panel>
				) : null}
				{step > 2 ? (
					<Steps.Panel className="pt-3">
						<Button onPress={reset} size="sm" testID="checkout-reset" variant="outline">
							Start again
						</Button>
					</Steps.Panel>
				) : null}
			</Steps.Item>
		</Steps>
	);
}
