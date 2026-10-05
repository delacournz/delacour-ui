import { PAGINATION_SIZES, Pagination, type PaginationSize } from "@delacour/react-native-ui/pagination";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Small draws at 36 points and reaches out to 44 with hit slop, so the run is tighter but no harder to hit.",
};

const LABELS: Record<PaginationSize, string> = {
	sm: "Small",
	md: "Medium",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-6">
			{PAGINATION_SIZES.map((size) => (
				<View className="items-center gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Pagination count={24} defaultPage={12} size={size} testID={`pagination-${size}`} />
				</View>
			))}
		</View>
	);
}
