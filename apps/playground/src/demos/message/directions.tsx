import { Avatar } from "@delacour/react-native-ui/avatar";
import { Message } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Incoming and outgoing",
	caption:
		"`direction` sets the side and the fill: incoming on `muted` with an avatar gutter, outgoing on `primary` with its delivery receipt underneath.",
	capture: { align: "stretch" },
};

const SENT_AT = new Date();

export function Demo(): ReactElement {
	return (
		<View className="w-full">
			<Message direction="incoming">
				<Message.Avatar>
					<Avatar name="Kate Austen" size="sm" />
				</Message.Avatar>
				<Message.Header>
					<Message.Author>Kate</Message.Author>
					<Message.Timestamp date={SENT_AT} />
				</Message.Header>
				<Message.Bubble>
					<Message.Text>Are we still on for tonight?</Message.Text>
				</Message.Bubble>
			</Message>
			<Message direction="outgoing" status={{ type: "read" }}>
				<Message.Bubble>
					<Message.Text>Yes — 7pm at the usual place.</Message.Text>
				</Message.Bubble>
				<Message.Status />
			</Message>
		</View>
	);
}
