import { isEmojiOnly, Message } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Emoji and plain",
	caption:
		'`tone="plain"` drops the fill. The app checks `isEmojiOnly` and draws a short emoji reply large and unfilled; the component never guesses.',
};

const REPLY = "🎉🙌";

export function Demo(): ReactElement {
	const isEmoji = isEmojiOnly(REPLY);

	return (
		<View className="w-full">
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Text>We got the booking!</Message.Text>
				</Message.Bubble>
			</Message>
			<Message direction="outgoing" size={isEmoji ? "lg" : "md"} tone={isEmoji ? "plain" : "default"}>
				<Message.Bubble>
					<Message.Text className={isEmoji ? "text-4xl" : undefined}>{REPLY}</Message.Text>
				</Message.Bubble>
			</Message>
		</View>
	);
}
