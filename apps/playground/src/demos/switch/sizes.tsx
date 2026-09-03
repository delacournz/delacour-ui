import { SWITCH_SIZES, Switch } from "delacour-react-native-ui/switch";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	caption:
		"The knob is a rounded rectangle lying on its side, not a disc: as wide as the track is tall, and shorter than it by twice the vertical inset. Both are fully rounded, so the two capsules come out concentric by construction rather than by a number.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SWITCH_SIZES.map((size) => (
				<View className="flex-row items-center gap-4" key={size}>
					<Switch color="success" defaultSelected size={size} />
					<Switch color="success" size={size} />
					<Text.Caption>size {size}</Text.Caption>
				</View>
			))}
		</View>
	);
}
