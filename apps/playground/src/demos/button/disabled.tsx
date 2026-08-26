import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Button isDisabled testID="disabled-primary">
				<Icon icon={IconPlusMedium} />
				<Button.Label>Cannot press this</Button.Label>
			</Button>
			<Button isDisabled testID="disabled-outline" variant="outline">
				Disabled outline
			</Button>
		</View>
	);
}
