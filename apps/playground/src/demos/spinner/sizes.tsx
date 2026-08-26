import { SPINNER_SIZES, Spinner } from "@delacour/native-ui/spinner";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	capture: { hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center gap-6">
			{SPINNER_SIZES.map((size) => (
				<View className="items-center gap-2" key={size}>
					<Spinner size={size} />
					<Text.Caption size="xs">{size}</Text.Caption>
				</View>
			))}
			<View className="items-center gap-2">
				<Spinner size={40} />
				<Text.Caption size="xs">40pt</Text.Caption>
			</View>
		</View>
	);
}
