import { RADIO_SIZES, Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The ring indexes the same --spacing-icon-* scale Icon and Spinner share, and the label names a Text size step rather than restating a type scale.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{RADIO_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{size}</Text.Caption>
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
