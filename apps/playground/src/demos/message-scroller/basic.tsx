import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A conversation",
	align: "stretch",
	caption:
		"Forty messages, opened at the newest. Runs from one sender close up, and `renderMessage` gets each message's `position` to pass to its bubble.",
	capture: { align: "stretch", flow: "message-scroller/basic", hero: true },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const LINES = [
	"Are we still on for Saturday?",
	"Yes! What time works?",
	"Ten-ish? The market opens at nine",
	"Perfect, I'll bring coffee",
	"Flat white for me please",
	"Of course",
	"Should we ask Isla too?",
	"Already did — they're in",
] as const;

const START = new Date(2026, 9, 5, 9, 0).getTime();

const MESSAGES: ChatMessage[] = Array.from({ length: 40 }, (_, index) => ({
	id: `m${index}`,
	author: index % 5 < 2 ? "aria" : "me",
	text: LINES[index % LINES.length] ?? "",
	sentAt: new Date(START + index * 90_000),
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
			className="h-96 flex-none rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			messages={MESSAGES}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-basic"
			viewerId="me"
		/>
	);
}
