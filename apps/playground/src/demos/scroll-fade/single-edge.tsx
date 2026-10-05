import { Button } from "@delacour/react-native-ui/button";
import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "One edge",
	caption: '`edges="end"` fades only where the terms run on into the button below them.',
};

const CLAUSES = [
	"You keep ownership of everything you upload.",
	"We store it in the region you choose.",
	"You can export or delete it at any time.",
	"We never sell it, or train on it.",
	"Either of us can end this with thirty days' notice.",
	"These terms change only with notice by email.",
] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="gap-4">
			<ScrollFade edges="end" scrollSource={source}>
				<Animated.ScrollView className="h-48" contentContainerClassName="gap-3" nestedScrollEnabled {...scrollProps}>
					{CLAUSES.map((clause) => (
						<Text.Paragraph key={clause}>{clause}</Text.Paragraph>
					))}
				</Animated.ScrollView>
			</ScrollFade>
			<Button>Accept</Button>
		</View>
	);
}
