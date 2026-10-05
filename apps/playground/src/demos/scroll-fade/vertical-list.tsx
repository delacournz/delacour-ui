import { Card } from "@delacour/react-native-ui/card";
import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A list in a card",
	caption:
		"At rest only the bottom edge fades, because there is more below and nothing above. Scroll and the top fades in over the first few points; reach the end and the bottom clears. The fade is the card's own colour, so it reads as rows passing under the edge rather than a grey band.",
	capture: { align: "stretch", flow: "scroll-fade/vertical-list", hero: true },
};

const ROWS = [
	"Invoice #1042 paid",
	"New sign-in from Wellington",
	"Weekly report ready",
	"Ana commented on Roadmap",
	"Storage at 80%",
	"Deploy finished in 42s",
	"Two new followers",
	"Backup completed",
	"Password changed",
	"Trial ends in 3 days",
] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<Card>
			<Card.Header>
				<Card.Title>Activity</Card.Title>
			</Card.Header>
			<ScrollFade color="card" scrollSource={source}>
				<Animated.ScrollView className="h-64" nestedScrollEnabled testID="scroll-fade-vertical" {...scrollProps}>
					{ROWS.map((row) => (
						<View className="px-4 py-3" key={row}>
							<Text.Paragraph>{row}</Text.Paragraph>
						</View>
					))}
				</Animated.ScrollView>
			</ScrollFade>
		</Card>
	);
}
