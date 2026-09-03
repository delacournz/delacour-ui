import { RADIO_SIZES, Radio } from "delacour-react-native-ui/radio";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The ring indexes the same --spacing-icon-* scale Icon and Spinner share, and the label names a Text size step rather than restating a type scale.",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof RADIO_SIZES)[number], string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{RADIO_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Radio.Group accessibilityLabel={`Size ${size}`} defaultSelected="a" orientation="horizontal" size={size}>
						<Radio testID={`radio-${size}-a`} value="a">
							First
						</Radio>
						<Radio testID={`radio-${size}-b`} value="b">
							Second
						</Radio>
					</Radio.Group>
				</View>
			))}
		</View>
	);
}
