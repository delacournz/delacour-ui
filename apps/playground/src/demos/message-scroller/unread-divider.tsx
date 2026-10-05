import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The unread divider",
	caption:
		'`firstUnreadKey` draws a rule above the first message you have not read, and `initialScrollTarget="unread"` opens the list there rather than at the end.',
};

type ChatMessage = { id: string; author: "me" | "kate"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();
const COUNT = 30;
const UNREAD = 3;

const MESSAGES: ChatMessage[] = Array.from({ length: COUNT }, (_, index) => ({
	id: `u${index}`,
	author: index >= COUNT - UNREAD || index % 3 !== 0 ? "kate" : "me",
	text: index >= COUNT - UNREAD ? `New: update ${index - COUNT + UNREAD + 1}` : "Earlier in the thread",
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
	return (
		<MessageScroller
			className="h-96 rounded-lg border border-border bg-background"
			firstUnreadKey={`u${COUNT - UNREAD}`}
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			initialScrollTarget="unread"
			messages={MESSAGES}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-unread"
			viewerId="me"
		/>
	);
}
