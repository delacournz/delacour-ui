import { Label } from "@delacour/react-native-ui/label";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Beside a switch",
	caption:
		"Outside a form layout, a label is just the text beside a control. `Text` takes `onPress`, so tapping the label can drive the control — the first row is controlled, the second leaves its switch uncontrolled and is disabled. A pressable label is hidden from assistive technology, since iOS would otherwise announce it as a link and the switch already carries its name.",
};

export function Demo(): ReactElement {
	const [isSelected, setIsSelected] = useState(true);

	return (
		<View className="gap-5">
			<View className="flex-row items-center justify-between gap-4">
				<View className="flex-1 gap-0.5">
					<Label
						accessibilityElementsHidden
						importantForAccessibility="no-hide-descendants"
						onPress={() => setIsSelected((value) => !value)}
						testID="notifications-label"
					>
						Notifications
					</Label>
					<Text.Caption>{isSelected ? "On" : "Off"}</Text.Caption>
				</View>
				<Switch
					accessibilityLabel="Notifications"
					isSelected={isSelected}
					onSelectedChange={setIsSelected}
					testID="notifications"
				/>
			</View>

			<View className="flex-row items-center justify-between gap-4">
				<Label className="flex-1" isDisabled>
					Location sharing
				</Label>
				<Switch accessibilityLabel="Location sharing" defaultSelected isDisabled testID="location" />
			</View>
		</View>
	);
}
