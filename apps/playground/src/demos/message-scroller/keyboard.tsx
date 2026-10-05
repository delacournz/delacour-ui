import { Button } from "@delacour/react-native-ui/button";
import { Input } from "@delacour/react-native-ui/input";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With a composer",
	caption:
		"A text field under the list. The list rises with the keyboard, keeping the newest message in view if you were there and your place if you were not; sending scrolls to the end.",
	keyboardAware: true,
};

type ChatMessage = { id: string; author: "me" | "kate"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();

const SEED: ChatMessage[] = Array.from({ length: 20 }, (_, index) => ({
	id: `k${index}`,
	author: index % 2 === 0 ? "kate" : "me",
	text: index % 2 === 0 ? "What do you think?" : "Let me check",
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
	const [messages, setMessages] = useState(SEED);
	const [draft, setDraft] = useState("");

	const send = (): void => {
		const text = draft.trim();
		if (text === "") return;
		setMessages((current) => [
			...current,
			{ id: `k${current.length}`, author: "me", text, sentAt: new Date(START + current.length * 60_000) },
		]);
		setDraft("");
	};

	return (
		<View className="gap-3">
			<MessageScroller
				className="h-80 rounded-lg border border-border bg-background"
				getDate={(message) => message.sentAt}
				getKey={(message) => message.id}
				getSenderId={(message) => message.author}
				messages={messages}
				renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
				testID="message-scroller-keyboard"
				viewerId="me"
			/>
			<View className="flex-row items-center gap-3">
				<Input
					className="flex-1"
					onChangeText={setDraft}
					onSubmitEditing={send}
					placeholder="Message"
					returnKeyType="send"
					testID="message-scroller-composer"
					value={draft}
				/>
				<Button onPress={send} testID="message-scroller-composer-send">
					Send
				</Button>
			</View>
		</View>
	);
}
