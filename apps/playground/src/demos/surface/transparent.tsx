import { Surface } from "@delacour/react-native-ui/surface";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Transparent",
	caption:
		"A transparent surface keeps the padding and the corner and paints nothing — so what is inside it still sits on the fill beneath. Toggle the wrapper: the inner panel steps from the card either way.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isWrapped, setWrapped] = useState(true);

	const inner = (
		<Surface testID="transparent-inner">
			<Text.Caption>Stepped from the card, not restarted at it.</Text.Caption>
		</Surface>
	);

	return (
		<Surface className="gap-3">
			<View className="flex-row items-center justify-between gap-3">
				<Text.Label>Transparent wrapper</Text.Label>
				<Switch
					accessibilityLabel="Transparent wrapper"
					isSelected={isWrapped}
					onSelectedChange={setWrapped}
					testID="transparent-toggle"
				/>
			</View>
			{isWrapped ? (
				<Surface className="border-border border-dashed" testID="transparent-wrapper" variant="transparent">
					{inner}
				</Surface>
			) : (
				inner
			)}
		</Surface>
	);
}
