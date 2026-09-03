import { TEXT_SIZES, Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Size",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof TEXT_SIZES)[number], string> = {
	xs: "XS",
	sm: "SM",
	md: "MD",
	lg: "LG",
	xl: "XL",
	"2xl": "2XL",
	"3xl": "3XL",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2">
			{TEXT_SIZES.map((size) => (
				<Text key={size} size={size}>
					{LABELS[size]}
				</Text>
			))}
		</View>
	);
}
