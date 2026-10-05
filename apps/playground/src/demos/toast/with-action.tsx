import { Button } from "@delacour/react-native-ui/button";
import { toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With an action",
	caption:
		"One action, here an undo. Pressing it runs `onPress` and hides the toast; with an action it stays six seconds rather than four.",
	align: "center",
	capture: { flow: "toast/with-action", frame: "device" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<Button
				onPress={() =>
					toast.show({
						title: "Conversation archived",
						action: { label: "Undo", onPress: () => toast.success("Conversation restored") },
					})
				}
				testID="toast-with-action"
				variant="secondary"
			>
				Archive
			</Button>
		</View>
	);
}
