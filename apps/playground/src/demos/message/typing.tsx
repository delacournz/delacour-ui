import { Avatar } from "@delacour/react-native-ui/avatar";
import { Message } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Typing",
	caption:
		'`Message.Typing` stands in for the bubble while the other side types — three staggered dots, read as "Kate is typing". Under reduce motion the dots rest.',
	capture: { flow: "message/typing" },
};

export function Demo(): ReactElement {
	return (
		<View className="w-full">
			<Message direction="incoming">
				<Message.Avatar>
					<Avatar name="Kate Austen" size="sm" />
				</Message.Avatar>
				<Message.Header>
					<Message.Author>Kate</Message.Author>
				</Message.Header>
				<Message.Typing />
			</Message>
		</View>
	);
}
