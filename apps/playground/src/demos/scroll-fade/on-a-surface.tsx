import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Name the surface",
	caption:
		"The fade is a colour, not a mask. Each strip passes its own surface as `color`; leave it at the default `background` over a card and the edge reads as a grey band.",
	capture: { align: "stretch" },
};

type Surface = "background" | "card" | "secondary";

const SURFACES: readonly Surface[] = ["background", "card", "secondary"];

const FILL: Record<Surface, string> = {
	background: "bg-background",
	card: "bg-card",
	secondary: "bg-secondary",
};

const LABELS: Record<Surface, string> = {
	background: "Background",
	card: "Card",
	secondary: "Secondary",
};

const CHIPS = ["Design", "Engineering", "Marketing", "Sales", "Support", "Finance", "Legal"] as const;

function Strip({ surface }: { surface: Surface }): ReactElement {
	const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });

	return (
		<View className={`gap-2 rounded-xl py-3 ${FILL[surface]}`}>
			<Text.Caption className="px-3">{LABELS[surface]}</Text.Caption>
			<ScrollFade color={surface} scrollSource={source} size={32}>
				<Animated.ScrollView
					contentContainerClassName="gap-2 px-3"
					horizontal
					showsHorizontalScrollIndicator={false}
					{...scrollProps}
				>
					{CHIPS.map((chip) => (
						<View className="rounded-full border border-border px-3 py-1.5" key={chip}>
							<Text.Label>{chip}</Text.Label>
						</View>
					))}
				</Animated.ScrollView>
			</ScrollFade>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SURFACES.map((surface) => (
				<Strip key={surface} surface={surface} />
			))}
		</View>
	);
}
