import { Icon } from "@delacour/native-ui/icon";
import { IconArrowsRepeatCircle } from "@delacour/native-ui/icons/central";
import { Spinner } from "@delacour/native-ui/spinner";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom glyph",
	align: "center",
	caption: "A bare child is wrapped automatically so it still rotates. `speed` sets the rate.",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-6">
			<View className="items-center gap-2">
				<Spinner color="destructive" size="lg">
					<Icon icon={IconArrowsRepeatCircle} />
				</Spinner>
				<Text.Caption size="xs">bare child</Text.Caption>
			</View>
			<View className="items-center gap-2">
				<Spinner color="warning" size="lg" speed={0.4}>
					<Icon icon={IconArrowsRepeatCircle} />
				</Spinner>
				<Text.Caption size="xs">speed 0.4</Text.Caption>
			</View>
			<View className="items-center gap-2">
				<Spinner size="lg" speed={2.5} />
				<Text.Caption size="xs">speed 2.5</Text.Caption>
			</View>
		</View>
	);
}
