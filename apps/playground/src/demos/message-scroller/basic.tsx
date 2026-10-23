import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A conversation",
	align: "stretch",
	caption:
		"Forty messages, opened at the newest. `renderMessage` gets each message's `position` to pass to `Message`, so a run from one sender closes up and tightens the corners where its bubbles meet.",
	capture: { align: "stretch", flow: true, hero: true },
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

/** `Message` reads `position` for both the run's spacing and the corners that face a neighbour. */
function Bubble({ message, position }: { message: ChatMessage; position: MessageRunPosition }): ReactElement {
	return (
		<Message direction={message.author === "me" ? "outgoing" : "incoming"} position={position}>
			<Message.Bubble>
				<Message.Text>{message.text}</Message.Text>
			</Message.Bubble>
		</Message>
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
			testID="message-scroller-basic"
			viewerId="me"
		/>
	);
}
