import { Button } from "@delacour/react-native-ui/button";
import { toast } from "@delacour/react-native-ui/toast";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Persistent",
	caption: "`duration: 0` stays until the ✕, a swipe or `toast.hide` — here `toast.hideAll`.",
	align: "center",
	capture: { flow: "toast/persistent", frame: "device" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center gap-3">
			<Button
				onPress={() =>
					toast.warning("You are offline", {
						id: "offline",
						description: "Edits are kept on this phone.",
						duration: 0,
					})
				}
				testID="toast-persistent"
				variant="outline"
			>
				Go offline
			</Button>
			<Button onPress={() => toast.hideAll()} testID="toast-hide-all" variant="ghost">
				Hide all
			</Button>
		</View>
	);
}
