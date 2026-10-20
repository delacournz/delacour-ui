import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import {
	TEXT_ANIMATION_ORDERS,
	TextAnimation,
	type TextAnimationOrder,
} from "@delacour/react-native-ui/text-animation";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Orders",
	caption: "Which unit enters first. `random` is seeded by the text, so a replay is the same shuffle every time.",
};

const LABELS: Record<TextAnimationOrder, string> = {
	forward: "Forward",
	reverse: "Reverse",
	center: "Center",
	random: "Random",
};

export function Demo(): ReactElement {
	const [run, setRun] = useState(0);

	return (
		<View className="gap-5">
			{TEXT_ANIMATION_ORDERS.map((order) => (
				<View className="gap-1" key={order}>
					<Text.Caption color="muted">{LABELS[order]}</Text.Caption>
					<TextAnimation
						effect={{ kind: "slide", from: "down", distance: 8 }}
						key={`${order}-${run}`}
						order={order}
						size="xl"
						split="character"
						weight="semibold"
					>
						Every unit on one clock
					</TextAnimation>
				</View>
			))}
			<Button
				className="self-start"
				onPress={() => setRun((current) => current + 1)}
				size="sm"
				testID="text-animation-orders-replay"
				variant="secondary"
			>
				<Button.Label>Replay</Button.Label>
			</Button>
		</View>
	);
}
