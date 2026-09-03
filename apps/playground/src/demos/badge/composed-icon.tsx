import { BADGE_SIZES, Badge } from "delacour-react-native-ui/badge";
import { Icon } from "delacour-react-native-ui/icon";
import { IconStar } from "delacour-react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Composed icon",
	align: "center",
	note: "The glyph is bare. It inherits the badge's icon size and its surface's colour from the root.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-2">
			{BADGE_SIZES.map((size) => (
				<Badge color="warning" key={size} size={size} variant="soft">
					<Icon icon={IconStar} />
					<Badge.Label>Premium</Badge.Label>
				</Badge>
			))}
		</View>
	);
}
