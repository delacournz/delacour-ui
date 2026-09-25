import { Input } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"`Text.Label`'s type scale on the foreground token, above the control it names. Nothing else is drawn, so it sits in any layout a form already has.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-1.5">
			<Label nativeID="basic-name">Full name</Label>
			<Input accessibilityLabelledBy="basic-name" placeholder="Ada Lovelace" testID="name" />
		</View>
	);
}
