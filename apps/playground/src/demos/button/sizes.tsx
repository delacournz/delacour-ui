import { BUTTON_SIZES, Button } from "@delacour/native-ui/button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_SIZES.map((size) => (
				<Button key={size} size={size} testID={`size-${size}`}>
					size {size}
				</Button>
			))}
		</View>
	);
}
