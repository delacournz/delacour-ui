import { Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Text at the ends",
	align: "center",
	caption:
		"A bare string is wrapped in a `Text` that inherits the layer's own treatment, so `ON` and `OFF` need nothing said at the call site.",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-4">
			<Switch color="success" defaultSelected size="lg">
				<Switch.StartContent>
					<Text>ON</Text>
				</Switch.StartContent>
				<Switch.EndContent>
					<Text>OFF</Text>
				</Switch.EndContent>
			</Switch>
			<Switch color="danger" size="lg">
				<Switch.StartContent>
					<Text>ON</Text>
				</Switch.StartContent>
				<Switch.EndContent>
					<Text>OFF</Text>
				</Switch.EndContent>
			</Switch>
		</View>
	);
}
