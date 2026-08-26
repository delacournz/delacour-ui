import { BUTTON_VARIANTS, Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_VARIANTS.map((variant) => (
				<Button key={variant} testID={`variant-${variant}`} variant={variant}>
					{variant}
				</Button>
			))}
		</View>
	);
}
