import { Switch } from "@delacour/native-ui/switch";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Without a label",
	align: "center",
	caption: "A switch with no text near it needs an `accessibilityLabel`, the same rule an icon-only `Button` follows.",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row">
			<Switch accessibilityLabel="Aeroplane mode" color="primary" defaultSelected />
		</View>
	);
}
