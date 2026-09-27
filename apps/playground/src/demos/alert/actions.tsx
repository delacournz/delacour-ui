import { Alert, useAlert } from "@delacour/react-native-ui/alert";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Actions",
	caption:
		"`Alert.Action` is a wrapping row under the description, and the buttons in it are the caller's. `useAlert().dismiss` closes the alert from inside. Reset brings it back.",
	capture: { align: "stretch", flow: "alert/actions" },
};

/** An action that closes the alert it sits in, with no setter passed down. */
function GotIt(): ReactElement {
	const { dismiss } = useAlert();
	return (
		<Button onPress={dismiss} size="sm" testID="actions-got-it" variant="outline">
			Got it
		</Button>
	);
}

export function Demo(): ReactElement {
	const [isRetrying, setRetrying] = useState(false);
	const [attempts, setAttempts] = useState(0);
	const [isWhatsNewOpen, setWhatsNewOpen] = useState(true);

	const reset = () => {
		setAttempts(0);
		setWhatsNewOpen(true);
	};

	useEffect(() => {
		if (!isRetrying) return;
		const timer = setTimeout(() => {
			setRetrying(false);
			setAttempts((count) => count + 1);
		}, 1200);
		return () => clearTimeout(timer);
	}, [isRetrying]);

	return (
		<View className="gap-3">
			<Alert status="destructive" testID="actions-sync">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Sync failed</Alert.Title>
					<Alert.Description testID="actions-attempts">
						{attempts === 0
							? "We couldn't reach the server."
							: `Still offline after ${attempts} ${attempts === 1 ? "retry" : "retries"}.`}
					</Alert.Description>
					<Alert.Action>
						<Button
							isLoading={isRetrying}
							onPress={() => setRetrying(true)}
							size="sm"
							testID="actions-retry"
							variant="destructive"
						>
							Try again
						</Button>
						<Button size="sm" variant="ghost">
							Work offline
						</Button>
					</Alert.Action>
				</Alert.Content>
			</Alert>
			<Alert isOpen={isWhatsNewOpen} onOpenChange={setWhatsNewOpen} status="info" testID="actions-whats-new">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>New: shared folders</Alert.Title>
					<Alert.Description>Invite people to a folder and they see everything in it.</Alert.Description>
					<Alert.Action>
						<GotIt />
					</Alert.Action>
				</Alert.Content>
			</Alert>
			{isWhatsNewOpen ? null : (
				<Button className="self-center" onPress={reset} size="sm" testID="actions-reset" variant="outline">
					Reset
				</Button>
			)}
		</View>
	);
}
