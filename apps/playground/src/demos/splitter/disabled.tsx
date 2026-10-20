import { Splitter } from "@delacour/react-native-ui/splitter";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	align: "stretch",
	note: "isDisabled on the root freezes every seam; on a handle it freezes that seam alone. A frozen grip dims and the handle reports disabled.",
};

const BOX = "h-32 rounded-lg border border-border border-continuous bg-card overflow-hidden";

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Splitter className={BOX} isDisabled>
				<Splitter.Pane />
				<Splitter.Handle testID="handle-disabled" />
				<Splitter.Pane />
			</Splitter>
			<Splitter className={BOX} defaultLayout={[30, 40, 30]}>
				<Splitter.Pane />
				<Splitter.Handle isDisabled testID="handle-0" />
				<Splitter.Pane />
				<Splitter.Handle testID="handle-1" />
				<Splitter.Pane />
			</Splitter>
		</View>
	);
}
