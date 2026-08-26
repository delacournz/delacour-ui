import { CHECKBOX_SIZES, Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "The box, its glyph and the label step together. A bare box sits below each row.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{CHECKBOX_SIZES.map((size) => (
				<View className="flex-row items-center gap-4" key={size}>
					<Checkbox color="primary" defaultChecked size={size} testID={`checkbox-${size}`}>
						<Checkbox.Label>size {size}</Checkbox.Label>
					</Checkbox>
					<Checkbox color="primary" size={size} />
				</View>
			))}
		</View>
	);
}
