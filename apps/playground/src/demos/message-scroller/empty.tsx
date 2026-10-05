import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBubble2 } from "@delacour/react-native-ui/icons/central";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "An empty conversation",
	align: "stretch",
	caption: "With no messages, `ListEmptyComponent` stands in — here an `EmptyState`.",
};

type ChatMessage = { id: string; author: "me" | "kate"; text: string; sentAt: Date };

const MESSAGES: ChatMessage[] = [];

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
