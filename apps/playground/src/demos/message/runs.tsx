import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Direction, type DirectionValue } from "@delacour/react-native-ui/direction";
import { Message, type MessageDirection, type MessagePosition } from "@delacour/react-native-ui/message";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Runs",
	caption:
		"The list computes `position` from each message's neighbours — `first`, `middle`, `last`, or `single` — and the corners facing a neighbour tighten so a run reads as one shape. Only the last of an incoming run shows the avatar; the rest keep its width. Corners are logical, so under right to left the run mirrors.",
	capture: { align: "stretch", flow: true, hero: true },
};

type Line = { direction: MessageDirection; text: string };

const LINES: Line[] = [
	{ direction: "incoming", text: "Did you see the forecast?" },
	{ direction: "incoming", text: "Rain all weekend." },
	{ direction: "incoming", text: "We might need plan B." },
	{ direction: "outgoing", text: "Indoor climbing?" },
	{ direction: "outgoing", text: "I can book for four." },
];

function positionOf(index: number, count: number): MessagePosition {
	const direction = LINES[index]?.direction;
	const joinsAbove = index > 0 && LINES[index - 1]?.direction === direction;
	const joinsBelow = index + 1 < count && LINES[index + 1]?.direction === direction;
	if (joinsAbove && joinsBelow) return "middle";
	if (joinsAbove) return "last";
	if (joinsBelow) return "first";
	return "single";
}

/**
 * A run assembling one message at a time, so each arrival tightens the corners it now shares with
 * the one above. Messages not yet sent keep their place at zero opacity, which holds the card's
 * height still while the run grows, and the flip mirrors the whole run for right to left.
 */
export function Demo(): ReactElement {
	const [count, setCount] = useState(LINES.length);
	const [dir, setDir] = useState<DirectionValue>("ltr");

	return (
		<View className="w-full gap-4">
			<Direction className="w-full" dir={dir}>
				{LINES.map((line, index) => {
					const isSent = index < count;
					return (
						<View
							aria-hidden={!isSent}
							key={line.text}
							pointerEvents={isSent ? "auto" : "none"}
							style={{ opacity: isSent ? 1 : 0 }}
						>
							<Message
								animateEntrance={isSent}
								direction={line.direction}
								key={isSent ? "sent" : "unsent"}
								position={positionOf(index, isSent ? count : LINES.length)}
							>
								<Message.Avatar>
									<Avatar name="Aria Whitlock" size="sm" />
								</Message.Avatar>
								<Message.Bubble>
									<Message.Text>{line.text}</Message.Text>
								</Message.Bubble>
							</Message>
						</View>
					);
				})}
			</Direction>
			<View className="flex-row justify-center gap-2">
				<Button
					onPress={() => setCount((current) => (current >= LINES.length ? 1 : current + 1))}
					size="sm"
					testID="message-runs-next"
					variant="outline"
				>
					<Button.Label>{count >= LINES.length ? "Start over" : "Next message"}</Button.Label>
				</Button>
				<Button
					onPress={() => setDir((current) => (current === "rtl" ? "ltr" : "rtl"))}
					size="sm"
					testID="message-runs-rtl"
					variant="outline"
				>
					<Button.Label>{dir === "rtl" ? "Left to right" : "Right to left"}</Button.Label>
				</Button>
			</View>
		</View>
	);
}
