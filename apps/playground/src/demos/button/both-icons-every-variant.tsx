import { BUTTON_VARIANTS, Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight, IconHeart } from "@delacour/native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Both icons, every variant",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_VARIANTS.map((variant) => (
				<Button key={variant} testID={`both-${variant}`} variant={variant}>
					<Icon icon={IconHeart} />
					<Button.Label>{variant}</Button.Label>
					<Icon icon={IconArrowRight} />
				</Button>
			))}
		</View>
	);
}
