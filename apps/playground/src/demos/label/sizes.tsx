import { INPUT_SIZES, Input, type InputSize } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import type { TextSize } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

/** The type step a label takes beside each field height. */
const LABEL_SIZES: Record<InputSize, TextSize> = {
	sm: "xs",
	md: "sm",
	lg: "md",
};

const NAMES: Record<InputSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"A label has no size axis of its own — `size` is `Text`'s, and it steps the required mark with it, because the mark is a nested run that inherits the label's scale.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{INPUT_SIZES.map((size) => (
				<View className="gap-1.5" key={size}>
					<Label isRequired size={LABEL_SIZES[size]}>
						{NAMES[size]}
					</Label>
					<Input placeholder={`size ${size}`} size={size} />
				</View>
			))}
		</View>
	);
}
