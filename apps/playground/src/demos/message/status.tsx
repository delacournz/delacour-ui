import { Button } from "@delacour/react-native-ui/button";
import { Message, type MessageStatus } from "@delacour/react-native-ui/message";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Delivery status",
	caption:
		"`status` is a receipt under the last outgoing bubble: sending dims the bubble, read turns the ticks to `info`, and failed edges the bubble in `destructive` with a Retry beside the receipt when `onRetry` is set.",
	capture: { align: "stretch", flow: true },
};

const CYCLE: MessageStatus[] = [{ type: "sending" }, { type: "sent" }, { type: "delivered" }, { type: "read" }];

export function Demo(): ReactElement {
	const [step, setStep] = useState(0);
	const [isFailed, setFailed] = useState(true);
	const status = CYCLE[step % CYCLE.length] ?? { type: "sent" };

	return (
		<View className="w-full gap-4">
			<Message direction="outgoing" status={status}>
				<Message.Bubble>
					<Message.Text>Booked for four at 10am.</Message.Text>
				</Message.Bubble>
				<Message.Status />
			</Message>
			<Message
				direction="outgoing"
				onRetry={() => setFailed(false)}
				status={isFailed ? { reason: "No connection", type: "failed" } : { type: "delivered" }}
			>
				<Message.Bubble>
					<Message.Text>Bring your own shoes.</Message.Text>
				</Message.Bubble>
				<Message.Status />
			</Message>
			<View className="flex-row justify-center gap-2">
				<Button
					onPress={() => setStep((current) => current + 1)}
					size="sm"
					testID="message-status-next"
					variant="outline"
				>
					<Button.Label>Next status</Button.Label>
				</Button>
				<Button onPress={() => setFailed(true)} size="sm" testID="message-status-fail" variant="outline">
					<Button.Label>Fail again</Button.Label>
				</Button>
			</View>
		</View>
	);
}
