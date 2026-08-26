import { Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long label in a narrow column",
	caption: "The label wraps and the box holds its square rather than being squashed by it.",
};

export function Demo(): ReactElement {
	return (
		<View className="w-48">
			<Checkbox color="warning" defaultChecked testID="checkbox-long">
				<Checkbox.Label>A deliberately long checkbox label that has to wrap onto several lines</Checkbox.Label>
			</Checkbox>
		</View>
	);
}
