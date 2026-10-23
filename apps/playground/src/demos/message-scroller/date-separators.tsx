import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Day separators",
	align: "stretch",
	caption:
		"Five days of messages. Each new calendar day gets a separator — Today, Yesterday, then a weekday inside the week — and a day boundary always starts a new run.",
	capture: { align: "stretch" },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const DAY_MS = 86_400_000;
const NOW = Date.now();

const MESSAGES: ChatMessage[] = Array.from({ length: 15 }, (_, index) => {
	const daysAgo = 4 - Math.floor(index / 3);
	return {
		id: `d${index}`,
		author: index % 2 === 0 ? "aria" : "me",
		text: index % 2 === 0 ? "Morning! How did it go?" : "Better than expected",
		sentAt: new Date(NOW - daysAgo * DAY_MS - (2 - (index % 3)) * 60_000),
	};
});

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
			bottomInset={12}
			className="h-96 flex-none rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			messages={MESSAGES}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-dates"
			viewerId="me"
		/>
	);
}
