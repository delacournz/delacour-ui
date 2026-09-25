import { Alert } from "@delacour/react-native-ui/alert";
import { Button } from "@delacour/react-native-ui/button";
import { Separator } from "@delacour/react-native-ui/separator";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Checkout",
	caption:
		"A failed payment as an app would show it: the alert sits inside the order card, retries in place, and turns to success when the charge goes through.",
	capture: { align: "stretch" },
};

type Payment = { state: "failed" } | { state: "retrying" } | { state: "paid"; reference: string };

export function Demo(): ReactElement {
	const [payment, setPayment] = useState<Payment>({ state: "failed" });

	useEffect(() => {
		if (payment.state !== "retrying") return;
		const timer = setTimeout(() => setPayment({ state: "paid", reference: "NZ-20931" }), 1200);
		return () => clearTimeout(timer);
	}, [payment.state]);

	return (
		<Surface className="gap-4" padding="lg">
			<View className="flex-row items-baseline justify-between">
				<Text.Header>Order summary</Text.Header>
				<Text.Label>$84.00</Text.Label>
			</View>
			<Separator />
			<View className="gap-1">
				<Text.Caption color="muted">2 × Merino crew, Charcoal</Text.Caption>
				<Text.Caption color="muted">Standard shipping</Text.Caption>
			</View>
			{payment.state === "paid" ? (
				<Alert status="success" testID="checkout-alert">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Payment received</Alert.Title>
						<Alert.Description testID="checkout-reference">Order {payment.reference} is on its way.</Alert.Description>
						<Alert.Action>
							<Button onPress={() => setPayment({ state: "failed" })} size="sm" testID="checkout-reset" variant="ghost">
								Start over
							</Button>
						</Alert.Action>
					</Alert.Content>
				</Alert>
			) : (
				<Alert status="destructive" testID="checkout-alert">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Card declined</Alert.Title>
						<Alert.Description>Your bank declined the charge on the card ending 4242.</Alert.Description>
						<Alert.Action>
							<Button
								isLoading={payment.state === "retrying"}
								onPress={() => setPayment({ state: "retrying" })}
								size="sm"
								testID="checkout-retry"
							>
								Try again
							</Button>
							<Button size="sm" variant="outline">
								Use another card
							</Button>
						</Alert.Action>
					</Alert.Content>
				</Alert>
			)}
		</Surface>
	);
}
