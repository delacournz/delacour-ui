import { Compare } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Grab anywhere",
	caption:
		'By default only the handle\'s 44pt band claims a touch, so a comparison inside a feed still scrolls. `grab="anywhere"` lets a horizontal drag start anywhere on the frame and a tap jump the seam — a vertical flick still fails over to the scroll view.',
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<Compare accessibilityLabel="Exposure" className="aspect-[4/3]" color="warning" grab="anywhere">
			<Compare.Before>
				<View className="flex-1 items-center justify-center bg-foreground">
					<Text.Title className="text-background">Under</Text.Title>
				</View>
			</Compare.Before>
			<Compare.After>
				<View className="flex-1 items-center justify-center bg-warning">
					<Text.Title className="text-warning-foreground">Exposed</Text.Title>
				</View>
			</Compare.After>
			<Compare.Handle testID="compare-anywhere-handle" />
		</Compare>
	);
}
