import { Icon } from "@delacour/react-native-ui/icon";
import { IconChart1 } from "@delacour/react-native-ui/icons/central";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bleed",
	caption:
		'`padding="none"` clips, so a banner, an image or a chart bled to the edge takes the surface\'s corner with it. The text below restates its own padding.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Surface padding="none" testID="surface-bleed">
			<View className="h-28 items-center justify-center bg-primary">
				<Icon color="primary-foreground" icon={IconChart1} size="2xl" />
			</View>
			<View className="gap-1 p-4">
				<Text.Label>Weekly report</Text.Label>
				<Text.Caption>The banner runs to the corners; the surface clips it.</Text.Caption>
			</View>
		</Surface>
	);
}
