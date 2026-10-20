import { Avatar } from "@delacour/react-native-ui/avatar";
import { CircularText } from "@delacour/react-native-ui/circular-text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Badge",
	align: "center",
	caption:
		'A ring around an `Avatar`. `side="outside"` stands the glyphs with their tops away from the centre; `side="inside"` turns them toward it, so the words read along the bottom.',
	capture: { flow: true },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row items-center gap-6">
			<CircularText
				centerContent={<Avatar name="Aria Whitlock" size="xl" />}
				color="muted"
				radius={52}
				repeat="fill"
				spin={{ kind: "loop" }}
			>
				TOP CONTRIBUTOR
			</CircularText>
			<CircularText
				centerContent={<Avatar name="Rawiri Kemp" size="xl" />}
				color="muted"
				radius={52}
				repeat="fill"
				side="inside"
				spin={{ kind: "loop" }}
			>
				TOP CONTRIBUTOR
			</CircularText>
		</View>
	);
}
