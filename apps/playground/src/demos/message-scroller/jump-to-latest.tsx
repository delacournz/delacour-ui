import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Jump to latest",
	caption:
		"Replies keep arriving every two seconds. Scroll up and the jump button appears with a count of what you have missed; tap it, or scroll back down, and the count clears.",
};

type ChatMessage = { id: string; author: "me" | "kate"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();
const ARRIVAL_MS = 2000;
const LIMIT = 60;

const SEED: ChatMessage[] = Array.from({ length: 30 }, (_, index) => ({
	id: `j${index}`,
	author: index % 4 === 0 ? "me" : "kate",
	text: index % 4 === 0 ? "Go on…" : `Point ${index + 1} of the story`,
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

	useEffect(() => {
		if (messages.length >= LIMIT) return;
		const timer = setTimeout(() => {
			setMessages((current) => [
				...current,
				{
					id: `j${current.length}`,
					author: "kate",
					text: `And another thing (${current.length + 1})`,
					sentAt: new Date(START + current.length * 60_000),
				},
			]);
		}, ARRIVAL_MS);
		return () => clearTimeout(timer);
	}, [messages.length]);

	return (
		<MessageScroller
			className="h-96 rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			getSenderName={(message) => (message.author === "kate" ? "Kate" : undefined)}
			messages={messages}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-jump"
			viewerId="me"
		>
			<MessageScroller.List />
			<MessageScroller.JumpButton placement="center" testID="message-scroller-jump-button" />
		</MessageScroller>
	);
}
