import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading older history",
	align: "stretch",
	caption:
		"Reach the top and the next page of twenty loads, with a spinner while it is in flight. The page lands above you without moving what you were reading; after three, `hasOlder` turns off.",
	capture: { align: "stretch", flow: true },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const PAGE = 20;
const PAGES = 4;
const LATENCY_MS = 900;
const END = new Date(2026, 9, 5, 18, 0).getTime();

function page(index: number): ChatMessage[] {
	return Array.from({ length: PAGE }, (_, offset) => {
		const position = (PAGES - index - 1) * PAGE + offset;
		return {
			id: `h${position}`,
			author: position % 3 === 0 ? "me" : "aria",
			text: `Message ${position + 1}`,
			sentAt: new Date(END - (PAGES * PAGE - position) * 4 * 60_000),
		};
	});
}

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
			bottomInset={12}
			className="h-96 flex-none rounded-lg border border-border bg-background"
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
