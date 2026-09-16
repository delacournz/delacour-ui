import { Button } from "@delacour/native-ui/button";
import { INPUT_SIZES, Input } from "@delacour/native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Beside a button",
	caption:
		"A field and a button at the same size are the same height. Any drift here is a token that has moved on one scale and not the other.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{INPUT_SIZES.map((size) => (
				<View className="flex-row items-center gap-2" key={size}>
					<View className="flex-1">
						<Input placeholder={size} size={size} />
					</View>
					<Button size={size}>Go</Button>
				</View>
			))}
		</View>
	);
}
