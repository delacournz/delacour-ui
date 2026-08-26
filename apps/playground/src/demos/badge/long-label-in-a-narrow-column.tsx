import { Badge } from "@delacour/native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long label in a narrow column",
	note: "Sized by its content, so it never stretches to the column.",
};

export function Demo(): ReactElement {
	return (
		<View className="w-40">
			<Badge color="info" variant="soft">
				A deliberately long badge label that has to wrap
			</Badge>
		</View>
	);
}
