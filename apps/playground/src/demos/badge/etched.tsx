import { BADGE_COLORS, Badge, type BadgeColor } from "@delacour/react-native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Etched",
	caption:
		'`material="etched"` squares the capsule to the small corner and tints the soft status fills as a low alpha of the status colour.',
	align: "stretch",
};

const LABELS: Record<BadgeColor, string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Failed",
	info: "Info",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{BADGE_COLORS.map((color) => (
					<Badge color={color} key={color} material="etched" variant="soft">
						{LABELS[color]}
					</Badge>
				))}
			</View>
			<View className="flex-row flex-wrap gap-2">
				{BADGE_COLORS.map((color) => (
					<Badge color={color} key={color} material="etched" variant="outline">
						{LABELS[color]}
					</Badge>
				))}
			</View>
		</View>
	);
}
