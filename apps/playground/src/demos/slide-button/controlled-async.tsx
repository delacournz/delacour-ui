import { Button } from "@delacour/react-native-ui/button";
import { SlideButton } from "@delacour/react-native-ui/slide-button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled, with slow work",
	caption:
		"Controlled by `isCompleted`. The release asks for completion; the handle waits at the end while the request runs, and the tick lands only when the parent says so.",
	align: "stretch",
};

type Transfer = { status: "idle" } | { status: "sending" } | { status: "sent"; at: string };

const SEND_MS = 1500;

export function Demo(): ReactElement {
	const [transfer, setTransfer] = useState<Transfer>({ status: "idle" });

	const send = (): void => {
		setTransfer({ status: "sending" });
		setTimeout(() => setTransfer({ status: "sent", at: new Date().toLocaleTimeString() }), SEND_MS);
	};

	return (
		<View className="gap-4">
			<SlideButton
				accessibilityActionLabel="Transfer $240"
				isCompleted={transfer.status === "sent"}
				isFullWidth
				onComplete={send}
				testID="controlled-transfer"
				variant="success"
			>
				<SlideButton.Label>Slide to transfer $240</SlideButton.Label>
			</SlideButton>
			<Text.Code className="self-center">
				{transfer.status === "sent" ? `sent at ${transfer.at}` : transfer.status}
			</Text.Code>
			<Button onPress={() => setTransfer({ status: "idle" })} size="sm" testID="controlled-reset" variant="ghost">
				Reset
			</Button>
		</View>
	);
}
