import { Message, type MessageDirection, type MessagePosition } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Right to left",
	caption:
		"Corners are logical, so under a right-to-left layout a run mirrors with nothing else said: outgoing sits on the left and tightens its left-hand corners.",
};

const LINES: { direction: MessageDirection; position: MessagePosition; text: string }[] = [
	{ direction: "incoming", position: "first", text: "مرحبا" },
	{ direction: "incoming", position: "last", text: "كيف حالك؟" },
	{ direction: "outgoing", position: "first", text: "بخير، شكرا" },
	{ direction: "outgoing", position: "last", text: "وأنت؟" },
];

export function Demo(): ReactElement {
	return (
		<View className="w-full" style={{ direction: "rtl" }}>
			{LINES.map((line) => (
				<Message direction={line.direction} key={line.text} position={line.position}>
					<Message.Bubble>
						<Message.Text>{line.text}</Message.Text>
					</Message.Bubble>
				</Message>
			))}
		</View>
	);
}
