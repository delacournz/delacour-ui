import { Compare } from "@delacour/react-native-ui/compare";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
	caption:
		"`isDisabled` turns the drag and the assistive actions off and fades the handle. The layers stay as they are.",
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<Compare accessibilityLabel="Locked comparison" className="aspect-video" defaultPosition={0.35} isDisabled>
			<Compare.Before>
				<View className="flex-1 bg-muted" />
			</Compare.Before>
			<Compare.After>
				<View className="flex-1 bg-secondary" />
			</Compare.After>
			<Compare.Handle testID="compare-disabled-handle" />
		</Compare>
	);
}
