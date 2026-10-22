import { Button } from "@delacour/react-native-ui/button";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Stick to the newest",
	align: "stretch",
	caption:
		"At the end, a new message pulls the list with it. Scroll up and a reply lands without moving you. Sending your own always brings you back down.",
	capture: { align: "stretch" },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();

const SEED: ChatMessage[] = Array.from({ length: 16 }, (_, index) => ({
	id: `s${index}`,
	author: index % 3 === 0 ? "me" : "aria",
	text: index % 3 === 0 ? "Sounds good" : `Update ${index + 1} on the plan`,
	sentAt: new Date(START + index * 60_000),
}));

const RUN_GAP: Record<MessageRunPosition, string> = { single: "mt-3", first: "mt-3", middle: "mt-0.5", last: "mt-0.5" };

function Bubble({ message, position }: { message: ChatMessage; position: MessageRunPosition }): ReactElement {
	const isMine = message.author === "me";
	return (
		<View
			className={`${RUN_GAP[position]} max-w-[80%] rounded-2xl px-3 py-2 ${isMine ? "self-end bg-primary" : "self-start bg-secondary"}`}
		>
			<Text className={isMine ? "text-primary-foreground" : "text-secondary-foreground"}>{message.text}</Text>
		</View>
	);
}

export function Demo(): ReactElement {
	const [messages, setMessages] = useState(SEED);

	const append = (author: ChatMessage["author"]): void => {
		setMessages((current) => [
			...current,
			{
				id: `n${current.length}`,
				author,
				text: author === "me" ? "On my way" : "Just saw this",
				sentAt: new Date(START + current.length * 60_000),
			},
		]);
	};

	return (
		<View className="gap-3">
			<MessageScroller
				bottomInset={12}
				className="h-80 flex-none rounded-lg border border-border bg-background"
				getDate={(message) => message.sentAt}
				getKey={(message) => message.id}
				getSenderId={(message) => message.author}
				messages={messages}
				renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
				testID="message-scroller-stick"
				viewerId="me"
			/>
			<View className="flex-row gap-3">
				<Button className="flex-1" onPress={() => append("aria")} testID="message-scroller-receive" variant="outline">
					Receive
				</Button>
				<Button className="flex-1" onPress={() => append("me")} testID="message-scroller-send">
					Send
				</Button>
			</View>
		</View>
	);
}
