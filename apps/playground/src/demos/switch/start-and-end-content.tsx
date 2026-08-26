import { Icon } from "@delacour/native-ui/icon";
import { IconCheckmark1Small, IconX } from "@delacour/native-ui/icons/central";
import { SWITCH_SIZES, Switch } from "@delacour/native-ui/switch";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Start and end content",
	caption:
		"Both are written once with no conditionals. `StartContent` is revealed as the switch turns on and `EndContent` as it turns off, each fading with the thumb's travel — so the knob reads as uncovering the other end. The glyphs take their step and colour from the switch.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-4">
			{SWITCH_SIZES.map((size) => (
				<Switch color="primary" defaultSelected key={size} size={size} testID={`switch-${size}`}>
					<Switch.StartContent>
						<Icon icon={IconCheckmark1Small} />
					</Switch.StartContent>
					<Switch.EndContent>
						<Icon icon={IconX} />
					</Switch.EndContent>
				</Switch>
			))}
		</View>
	);
}
