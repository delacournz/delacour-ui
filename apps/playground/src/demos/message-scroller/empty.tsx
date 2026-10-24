import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBubble2 } from "@delacour/react-native-ui/icons/central";
import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An empty conversation",
	align: "stretch",
	caption: "With no messages, `ListEmptyComponent` stands in — here an `EmptyState`.",
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const MESSAGES: ChatMessage[] = [];

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
			className="h-80 flex-none rounded-lg border border-border bg-background"
			getDate={(message) => message.sentAt}
			getKey={(message) => message.id}
			getSenderId={(message) => message.author}
			ListEmptyComponent={
				<EmptyState>
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconBubble2} />
						</EmptyState.Media>
						<EmptyState.Title>No messages yet</EmptyState.Title>
						<EmptyState.Description>Say hello to start the conversation.</EmptyState.Description>
					</EmptyState.Header>
				</EmptyState>
			}
			messages={MESSAGES}
			renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
			testID="message-scroller-empty"
			viewerId="me"
		/>
	);
}
