import { BUTTON_LABEL_SIZES, Button, type ButtonLabelSize } from "delacour-react-native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Three heights, each paired with its own label step.",
	capture: { align: "stretch" },
};

const LABELS: Record<ButtonLabelSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_LABEL_SIZES.map((size) => (
				<Button key={size} size={size} testID={`size-${size}`}>
					{LABELS[size]}
				</Button>
			))}
		</View>
	);
}
