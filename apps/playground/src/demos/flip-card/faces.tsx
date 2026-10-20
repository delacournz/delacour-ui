import { FlipCard } from "@delacour/react-native-ui/flip-card";
import { SURFACE_FILLED_VARIANTS, type SurfaceVariant } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Faces",
	caption:
		"Each face is a `Surface`, so `variant` and `padding` are its fill ladder and its steps. The back defaults one step down from the front so the two read apart, and it must be opaque — a `transparent` back warns.",
	capture: { align: "stretch" },
};

const LABELS: Record<SurfaceVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	tertiary: "Tertiary",
	transparent: "Transparent",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SURFACE_FILLED_VARIANTS.map((variant) => (
				<FlipCard className="h-20" key={variant}>
					<FlipCard.Front padding="sm" variant={variant}>
						<Text.Label>{LABELS[variant]}</Text.Label>
						<Text.Caption>Front</Text.Caption>
					</FlipCard.Front>
					<FlipCard.Back padding="lg">
						<Text.Label>Secondary, the default back</Text.Label>
					</FlipCard.Back>
				</FlipCard>
			))}
		</View>
	);
}
