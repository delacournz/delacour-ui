import { Compare } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	caption:
		'`orientation="vertical"` puts Before on top and drags the seam up and down. Like a vertical `Slider` it fills the height it is given, so the frame needs a definite one.',
	capture: { align: "stretch", flow: "compare/vertical" },
};

export function Demo(): ReactElement {
	return (
		<Compare accessibilityLabel="Sky" className="h-72" color="info" orientation="vertical">
			<Compare.Before>
				<View className="flex-1 items-center justify-start bg-info pt-14">
					<Text.Title className="text-info-foreground">Morning</Text.Title>
				</View>
			</Compare.Before>
			<Compare.After>
				<View className="flex-1 items-center justify-end bg-foreground pb-14">
					<Text.Title className="text-background">Night</Text.Title>
				</View>
			</Compare.After>
			<Compare.Label placement="end" side="before">
				Morning
			</Compare.Label>
			<Compare.Label placement="end" side="after">
				Night
			</Compare.Label>
			<Compare.Handle testID="compare-vertical-handle" />
		</Compare>
	);
}
