import { Chip } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBug, IconLightning, IconSparkle } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tags",
	caption:
		"With no handler a chip is a plain view — nothing to aim at, and nothing a screen reader announces as a control.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap gap-2">
			<Chip color="destructive">
				<Icon icon={IconBug} />
				<Chip.Label>Bug</Chip.Label>
			</Chip>
			<Chip color="info">
				<Icon icon={IconSparkle} />
				<Chip.Label>Feature</Chip.Label>
			</Chip>
			<Chip color="warning" variant="outline">
				<Icon icon={IconLightning} />
				<Chip.Label>Performance</Chip.Label>
			</Chip>
			<Chip variant="outline">Documentation</Chip>
		</View>
	);
}
