import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading older history",
	caption:
		"Reach the top and the next page of twenty loads, with a spinner while it is in flight. The page lands above you without moving what you were reading; after three, `hasOlder` turns off.",
};

type ChatMessage = { id: string; author: "me" | "kate"; text: string; sentAt: Date };

const PAGE = 20;
const PAGES = 4;
const LATENCY_MS = 900;
const END = new Date(2026, 9, 5, 18, 0).getTime();

function page(index: number): ChatMessage[] {
	return Array.from({ length: PAGE }, (_, offset) => {
		const position = (PAGES - index - 1) * PAGE + offset;
		return {
			id: `h${position}`,
			author: position % 3 === 0 ? "me" : "kate",
			text: `Message ${position + 1}`,
			sentAt: new Date(END - (PAGES * PAGE - position) * 4 * 60_000),
		};
	});
}

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
	const [pages, setPages] = useState(1);
	const [messages, setMessages] = useState(() => page(0));
	const [isLoading, setLoading] = useState(false);

	const loadOlder = (): void => {
		setLoading(true);
		setTimeout(() => {
			setMessages((current) => [...page(pages), ...current]);
			setPages((count) => count + 1);
			setLoading(false);
		}, LATENCY_MS);
	};

	return (
		<MessageScroller
			className="h-96 rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			hasOlder={pages < PAGES}
			isLoadingOlder={isLoading}
			messages={messages}
			onLoadOlder={loadOlder}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-older"
			viewerId="me"
		/>
	);
}
