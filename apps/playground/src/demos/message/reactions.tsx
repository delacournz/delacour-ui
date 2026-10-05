import { Chip } from "@delacour/react-native-ui/chip";
import { Message, type MessageReactionPlacement } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reactions",
	caption:
		"`Message.Reactions` takes chips as children. `overlap` hangs them over the bubble's bottom edge; `below` gives them a line of their own.",
	align: "stretch",
};

const TEXT: Record<MessageReactionPlacement, string> = {
	overlap: "The tickets just went on sale!",
	below: "Got two for Saturday.",
};

export function Demo(): ReactElement {
	return (
		<View className="w-full gap-2">
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Text>{TEXT.overlap}</Message.Text>
				</Message.Bubble>
				<Message.Reactions placement="overlap">
					<Chip key="fire" size="sm">
						🔥 3
					</Chip>
					<Chip key="eyes" size="sm">
						👀 1
					</Chip>
				</Message.Reactions>
			</Message>
			<Message direction="outgoing">
				<Message.Bubble>
					<Message.Text>{TEXT.below}</Message.Text>
				</Message.Bubble>
				<Message.Reactions placement="below">
					<Chip key="heart" size="sm">
						❤️ 2
					</Chip>
				</Message.Reactions>
			</Message>
		</View>
	);
}
