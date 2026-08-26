import { CHECKBOX_SIZES, Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Bare boxes and their targets",
	caption:
		"A checkbox with no label takes hit slop out toward the 44pt minimum. One with a label does not — the row is already the target, and slop on top of it would overlap the row below.",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-6">
			{CHECKBOX_SIZES.map((size) => (
				<Checkbox color="primary" defaultChecked key={size} size={size} testID={`checkbox-${size}`} />
			))}
		</View>
	);
}
