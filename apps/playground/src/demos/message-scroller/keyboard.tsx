import { Button } from "@delacour/react-native-ui/button";
import { Input } from "@delacour/react-native-ui/input";
import { Message } from "@delacour/react-native-ui/message";
import { type MessageRunPosition, MessageScroller } from "@delacour/react-native-ui/message-scroller";
import { type ReactElement, useRef, useState } from "react";
import { useWindowDimensions, View, type ViewInstance } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With a composer",
	align: "stretch",
	caption:
		"A text field under the list. `keyboardOffset` is the list's distance from the bottom of the screen, measured here, so the list rises by only the part of the keyboard that covers it — keeping the newest message in view if you were there and your place if you were not. Sending scrolls to the end.",
	keyboardAware: true,
};

type ChatMessage = { id: string; author: "me" | "aria"; text: string; sentAt: Date };

const START = new Date(2026, 9, 5, 9, 0).getTime();

const SEED: ChatMessage[] = Array.from({ length: 20 }, (_, index) => ({
	id: `k${index}`,
	author: index % 2 === 0 ? "aria" : "me",
	text: index % 2 === 0 ? "What do you think?" : "Let me check",
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
	const [messages, setMessages] = useState(SEED);
	const [draft, setDraft] = useState("");
	const [keyboardOffset, setKeyboardOffset] = useState(0);
	const frameRef = useRef<ViewInstance>(null);
	const { height: windowHeight } = useWindowDimensions();

	const measure = (): void => {
		frameRef.current?.measureInWindow((_x, y, _width, height) => {
			setKeyboardOffset(Math.max(0, windowHeight - y - height));
		});
	};

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
			<View onLayout={measure} ref={frameRef}>
				<MessageScroller
					bottomInset={12}
					className="h-80 flex-none rounded-lg border border-border bg-background"
					getDate={(message) => message.sentAt}
					getKey={(message) => message.id}
					getSenderId={(message) => message.author}
					messages={messages}
					renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
					keyboardOffset={keyboardOffset}
					testID="message-scroller-keyboard"
					viewerId="me"
				/>
			</View>
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
