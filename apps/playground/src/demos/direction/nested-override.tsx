import { Direction } from "@delacour/react-native-ui/direction";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nested override",
	caption:
		"An Arabic contact card reads right to left, but a phone number does not. The inner `Direction` puts the number's row back to left to right without touching the card around it.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Direction dir="rtl">
			<View className="gap-3 rounded-lg border border-border bg-card p-4">
				<Text.Header>مكتب الاستقبال</Text.Header>
				<Text.Paragraph>اتصل بنا من الأحد إلى الخميس، من التاسعة صباحاً حتى الخامسة مساءً.</Text.Paragraph>
				<Direction dir="ltr">
					<View className="flex-row items-center gap-2" testID="nested-ltr">
						<Text.Label>Tel</Text.Label>
						<Text.Code>+1 555 010 4477</Text.Code>
					</View>
				</Direction>
			</View>
		</Direction>
	);
}
