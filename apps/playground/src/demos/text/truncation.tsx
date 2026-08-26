import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Truncation",
	capture: { align: "stretch" },
};

const LOREM =
	"A nested Text adopts the treatment around it and overrides only the axes it names, which is what React Native does natively with a nested Text's style.";

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Text.Paragraph numberOfLines={1}>{LOREM}</Text.Paragraph>
			<Text.Paragraph numberOfLines={2}>{LOREM}</Text.Paragraph>
		</View>
	);
}
