import { Button } from "@delacour/react-native-ui/button";
import { useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ScrollBlur } from "@delacour/react-native-ui/scroll-blur";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A list under a floating button",
	caption:
		"The rows blur out as they reach the button, so its label stays legible over whatever colour is passing beneath. The button is a sibling after the `ScrollBlur`, never a child — the band paints over its children.",
	align: "stretch",
};

const ROWS = [
	{ id: "dune", title: "Dune", detail: "Ochre sand at golden hour", color: "#f59e0b" },
	{ id: "lagoon", title: "Lagoon", detail: "Shallow water over white sand", color: "#06b6d4" },
	{ id: "fern", title: "Fern", detail: "Understorey after rain", color: "#22c55e" },
	{ id: "dusk", title: "Dusk", detail: "The last light over the harbour", color: "#8b5cf6" },
	{ id: "ember", title: "Ember", detail: "A fire burning down", color: "#ef4444" },
	{ id: "glacier", title: "Glacier", detail: "Blue ice under cloud", color: "#3b82f6" },
	{ id: "orchard", title: "Orchard", detail: "Apples in late summer", color: "#84cc16" },
	{ id: "coral", title: "Coral", detail: "A reef at low tide", color: "#f97316" },
	{ id: "bloom", title: "Bloom", detail: "Pohutukawa in December", color: "#ec4899" },
	{ id: "slate", title: "Slate", detail: "Wet stone on the coast road", color: "#64748b" },
] as const;

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="h-[440px] overflow-hidden rounded-lg">
			<ScrollBlur className="flex-1" edges="end" scrollSource={source} size={112}>
				<Animated.ScrollView contentContainerClassName="gap-2 pb-24" testID="scroll-blur-list" {...scrollProps}>
					{ROWS.map((row) => (
						<View className="h-20 justify-end rounded-lg p-4" key={row.id} style={{ backgroundColor: row.color }}>
							<Text.Header className="text-white">{row.title}</Text.Header>
							<Text.Caption className="text-white/80">{row.detail}</Text.Caption>
						</View>
					))}
				</Animated.ScrollView>
			</ScrollBlur>
			<View className="absolute inset-x-0 bottom-0 p-4">
				<Button>
					<Button.Label>Continue</Button.Label>
				</Button>
			</View>
		</View>
	);
}
