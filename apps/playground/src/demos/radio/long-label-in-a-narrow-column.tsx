import { Radio } from "@delacour/native-ui/radio";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long label in a narrow column",
	note: "The ring never squashes and the label wraps — shrink rather than flex-1, which would collapse to nothing in a horizontal group.",
};

export function Demo(): ReactElement {
	return (
		<View className="w-48">
			<Radio.Group accessibilityLabel="Long label" defaultSelected="a">
				<Radio testID="radio-long" value="a">
					A deliberately long option label that has to wrap onto several lines
				</Radio>
				<Radio testID="radio-short" value="b">
					Short
				</Radio>
			</Radio.Group>
		</View>
	);
}
