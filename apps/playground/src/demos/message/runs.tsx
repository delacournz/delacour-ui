import { Avatar } from "@delacour/react-native-ui/avatar";
import { Message, type MessageDirection, type MessagePosition } from "@delacour/react-native-ui/message";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Runs",
	caption:
		"The list computes `position` from each message's neighbours — `first`, `middle`, `last`, or `single` — and the corners facing a neighbour tighten so a run reads as one stack. Only the last of an incoming run shows the avatar; the rest keep its width.",
	align: "stretch",
};

type Line = { direction: MessageDirection; text: string };

const LINES: Line[] = [
	{ direction: "incoming", text: "Did you see the forecast?" },
	{ direction: "incoming", text: "Rain all weekend." },
	{ direction: "incoming", text: "We might need plan B." },
	{ direction: "outgoing", text: "Indoor climbing?" },
	{ direction: "outgoing", text: "I can book for four." },
];

function positionOf(index: number): MessagePosition {
	const direction = LINES[index]?.direction;
	const joinsAbove = LINES[index - 1]?.direction === direction;
	const joinsBelow = LINES[index + 1]?.direction === direction;
	if (joinsAbove && joinsBelow) return "middle";
	if (joinsAbove) return "last";
	if (joinsBelow) return "first";
	return "single";
}

export function Demo(): ReactElement {
	return (
		<View className="w-full">
			{LINES.map((line, index) => (
				<Message direction={line.direction} key={line.text} position={positionOf(index)}>
					<Message.Avatar>
						<Avatar name="Kate Austen" size="sm" />
					</Message.Avatar>
					<Message.Bubble>
						<Message.Text>{line.text}</Message.Text>
					</Message.Bubble>
				</Message>
			))}
		</View>
	);
}
