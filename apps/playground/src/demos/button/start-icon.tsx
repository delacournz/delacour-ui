import { BUTTON_SIZES, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Start icon",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_SIZES.map((size) => (
				<Button key={size} size={size} testID={`add-${size}`}>
					<Icon icon={IconPlusMedium} />
					<Button.Label>Add item</Button.Label>
				</Button>
			))}
		</View>
	);
}
