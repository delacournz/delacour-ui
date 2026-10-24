import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "The unread divider",
	align: "stretch",
	caption:
		'`firstUnreadKey` draws a rule above the first message you have not read, and `initialScrollTarget="unread"` opens the list there rather than at the end.',
	capture: { align: "stretch" },
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();
const COUNT = 30;
const UNREAD = 3;

const MESSAGES: ChatMessage[] = Array.from({ length: COUNT }, (_, index) => ({
	id: `u${index}`,
	author: index >= COUNT - UNREAD || index % 3 !== 0 ? "aria" : "me",
	text: index >= COUNT - UNREAD ? `New: update ${index - COUNT + UNREAD + 1}` : "Earlier in the thread",
	sentAt: new Date(START + index * 60_000),
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
