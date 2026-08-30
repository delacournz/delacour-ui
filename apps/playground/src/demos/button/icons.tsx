import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconPlusMedium } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Icons",
	caption: "Icons are composed, never passed as props. Where one sits is where you put it.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Button testID="icon-start">
				<Icon icon={IconPlusMedium} />
				<Button.Label>Add item</Button.Label>
			</Button>
			<Button testID="icon-end" variant="secondary">
				<Button.Label>Continue</Button.Label>
				<Icon icon={IconArrowRight} />
			</Button>
			<Button testID="icon-both" variant="outline">
				<Icon icon={IconPlusMedium} />
				<Button.Label>Add and continue</Button.Label>
				<Icon icon={IconArrowRight} />
			</Button>
		</View>
	);
}
