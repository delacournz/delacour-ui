import {
	COMPARE_COLORS,
	COMPARE_SIZES,
	Compare,
	type CompareColor,
	type CompareSize,
} from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours and sizes",
	caption:
		"`color` paints the divider and the grip capsule, and the glyph takes that colour's foreground. `size` moves the capsule only — its touch band stays 44pt at every size.",
	align: "stretch",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const COLOR_LABELS: Record<CompareColor, string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

const SIZE_LABELS: Record<CompareSize, string> = { sm: "Small", md: "Medium", lg: "Large" };

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{COMPARE_COLORS.map((color, index) => {
				const size = COMPARE_SIZES[index % COMPARE_SIZES.length] ?? "md";
				return (
					<Compare accessibilityLabel={COLOR_LABELS[color]} className="h-14" color={color} key={color} size={size}>
						<Compare.Before>
							<View className="flex-1 justify-center bg-muted px-3">
								<Text.Caption>{COLOR_LABELS[color]}</Text.Caption>
							</View>
						</Compare.Before>
						<Compare.After>
							<View className="flex-1 items-end justify-center bg-card px-3">
								<Text.Caption color="muted">{SIZE_LABELS[size]}</Text.Caption>
							</View>
						</Compare.After>
						<Compare.Handle testID={`compare-${color}-handle`} />
					</Compare>
				);
			})}
		</View>
	);
}
