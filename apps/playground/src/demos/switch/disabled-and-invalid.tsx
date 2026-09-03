import { Switch } from "delacour-react-native-ui/switch";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and invalid",
	align: "center",
	caption:
		"Disabled blocks the gesture and fades the whole control. Invalid returns destructive at both ends, on the track and on the knob, so there is nothing to fade — the colour is the signal before the switch is on as much as after.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-4">
			<Switch color="primary" defaultSelected isDisabled />
			<Switch color="primary" isDisabled />
			<Switch defaultSelected isInvalid />
			<Switch isInvalid />
		</View>
	);
}
