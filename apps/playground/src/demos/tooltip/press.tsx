import { Icon } from "@delacour/react-native-ui/icon";
import { IconCircleInfo } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { Tooltip } from "@delacour/react-native-ui/tooltip";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Open on press",
	caption: '`openOn="press"` opens it on a tap — for an info glyph, which has no tap of its own to protect.',
	align: "center",
	capture: { flow: "tooltip/press", frame: "device" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<View className="flex-row items-center gap-1.5">
				<Text.Label>Storage used</Text.Label>
				<Tooltip label="Includes photos, files and backups" openOn="press">
					<Tooltip.Trigger accessibilityLabel="About storage" hitSlop={12} testID="tooltip-info">
						<Icon color="muted-foreground" icon={IconCircleInfo} size="sm" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<Tooltip.Arrow />
						<Tooltip.Text>Includes photos, files and backups</Tooltip.Text>
					</Tooltip.Content>
				</Tooltip>
			</View>
		</View>
	);
}
