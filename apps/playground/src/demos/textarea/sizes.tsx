import { Field } from "@delacour/react-native-ui/field";
import { INPUT_SIZES, type InputSize } from "@delacour/react-native-ui/input";
import { Textarea } from "@delacour/react-native-ui/textarea";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"`size` moves the type and the leading, not the row count — all three are three rows tall, each at its own line height.",
	keyboardAware: true,
	capture: { align: "stretch" },
};

const LABELS: Record<InputSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_SIZES.map((size) => (
				<Field key={size}>
					<Field.Label>{LABELS[size]}</Field.Label>
					<Textarea defaultValue={"One\nTwo\nThree"} rows={3} size={size} testID={`size-${size}`} />
				</Field>
			))}
		</View>
	);
}
