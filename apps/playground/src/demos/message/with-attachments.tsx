import { Icon } from "@delacour/react-native-ui/icon";
import { IconFilePdf, IconImages1 } from "@delacour/react-native-ui/icons/central";
import { Message } from "@delacour/react-native-ui/message";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Attachments",
	caption:
		"`Message.Attachments` is a clipped stack for media and file tiles. On a bubble marked `isMedia` it fills edge to edge; beside text it sits inside the padding. Any tile goes in — these are plain views.",
};

export function Demo(): ReactElement {
	return (
		<View className="w-full gap-2">
			<Message direction="outgoing">
				<Message.Bubble isMedia>
					<Message.Attachments>
						<View className="h-40 w-56 items-center justify-center bg-tertiary">
							<Icon icon={IconImages1} size="xl" />
						</View>
					</Message.Attachments>
				</Message.Bubble>
			</Message>
			<Message direction="incoming">
				<Message.Bubble>
					<Message.Attachments>
						<View className="flex-row items-center gap-2 bg-background p-3">
							<Icon icon={IconFilePdf} />
							<Text size="sm">itinerary.pdf · 1.2 MB</Text>
						</View>
					</Message.Attachments>
					<Message.Text>Here's the plan.</Message.Text>
				</Message.Bubble>
			</Message>
		</View>
	);
}
