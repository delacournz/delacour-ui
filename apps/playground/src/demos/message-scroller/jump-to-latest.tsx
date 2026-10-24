import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Jump to latest",
	align: "stretch",
	caption:
		"Replies keep arriving every two seconds. Scroll up and the jump button appears with a count of what you have missed; tap it, or scroll back down, and the count clears.",
	capture: { align: "stretch", flow: true },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();
const ARRIVAL_MS = 2000;
const LIMIT = 60;

const SEED_LENGTH = 30;
const MY_LAST = 21;

/** Aria's run at the end matches what keeps arriving, so the newest end looks the same however much has landed. */
const SEED: ChatMessage[] = Array.from({ length: SEED_LENGTH }, (_, index) => {
	const isMine = index % 4 === 0 && index <= MY_LAST;
	return {
		id: `j${index}`,
		author: isMine ? "me" : "aria",
		text: isMine ? "Go on…" : `Point ${index + 1} of the story`,
		sentAt: new Date(START + index * 60_000),
	};
});

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
	const [messages, setMessages] = useState(SEED);

	useEffect(() => {
		if (messages.length >= LIMIT) return;
		const timer = setTimeout(() => {
			setMessages((current) => [
				...current,
				{
					id: `j${current.length}`,
					author: "aria",
					text: `Point ${current.length + 1} of the story`,
					sentAt: new Date(START + current.length * 60_000),
				},
			]);
		}, ARRIVAL_MS);
		return () => clearTimeout(timer);
	}, [messages.length]);

	return (
		<MessageScroller
			bottomInset={12}
			className="h-96 flex-none rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			getSenderName={(message) => (message.author === "aria" ? "Aria" : undefined)}
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
