import { Attachment } from "@delacour/react-native-ui/attachment";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside a message",
	note: "A `card` is the attachment's home in a conversation: full width, read-only, tapped to open. The bubble here is a plain view — the attachment only needs to be its child.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="max-w-[85%] gap-2 self-start rounded-2xl bg-muted p-2">
				<Text.Paragraph className="px-2 pt-1">Here are the revised drawings.</Text.Paragraph>
				<Attachment
					kind="file"
					layout="card"
					name="drawings-rev-c.pdf"
					onPress={() => undefined}
					sizeBytes={5_976_883}
					testID="attachment-message-file"
				/>
				<Attachment
					durationMs={48_000}
					kind="video"
					layout="card"
					name="walkthrough.mp4"
					onPress={() => undefined}
					sizeBytes={23_068_672}
				/>
			</View>
		</View>
	);
}
