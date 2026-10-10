import { BADGE_SIZES, Badge } from "@delacour/react-native-ui/badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Counts",
	align: "center",
	note: "One digit sits in a circle and more in a capsule. Past `max` the number stops at `99+`, and a count of zero draws nothing unless `showZero` is set.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<View className="flex-row items-center gap-3">
				<Badge color="destructive" count={3} />
				<Badge color="destructive" count={42} />
				<Badge color="destructive" count={128} />
				<Badge color="destructive" count={12} max={9} />
				<Badge count={0} showZero />
			</View>
			<View className="flex-row items-center gap-3">
				{BADGE_SIZES.map((size) => (
					<Badge color="primary" count={7} key={size} size={size} />
				))}
				<Badge color="info" count={24} variant="soft" />
				<Badge color="success" count={24} variant="outline" />
			</View>
		</View>
	);
}
