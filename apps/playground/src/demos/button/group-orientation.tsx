import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconMinusMedium, IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group orientation",
	caption:
		"A vertical run squares top and bottom instead of the ends. Horizontal groups square the inline axis, so they flip under RTL.",
	align: "center",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-start gap-6">
			<Button.Group testID="group-horizontal" variant="outline">
				<Button accessibilityLabel="Fewer" size="icon-md" testID="horizontal-fewer">
					<Icon icon={IconMinusMedium} />
				</Button>
				<Button accessibilityLabel="More" size="icon-md" testID="horizontal-more">
					<Icon icon={IconPlusMedium} />
				</Button>
			</Button.Group>
			<Button.Group orientation="vertical" testID="group-vertical" variant="outline">
				<Button accessibilityLabel="More" size="icon-md" testID="vertical-more">
					<Icon icon={IconPlusMedium} />
				</Button>
				<Button accessibilityLabel="Fewer" size="icon-md" testID="vertical-fewer">
					<Icon icon={IconMinusMedium} />
				</Button>
			</Button.Group>
		</View>
	);
}
