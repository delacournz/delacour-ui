import { BADGE_VARIANTS, Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconCheckmark1Small } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Trailing icon, every variant",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			{BADGE_VARIANTS.map((variant) => (
				<Badge color="success" key={variant} variant={variant}>
					<Badge.Label>Verified</Badge.Label>
					<Icon icon={IconCheckmark1Small} />
				</Badge>
			))}
		</View>
	);
}
