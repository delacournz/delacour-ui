import {
	SEARCH_BAR_SHAPES,
	SEARCH_BAR_SIZES,
	SEARCH_BAR_VARIANTS,
	SearchBar,
	type SearchBarShape,
	type SearchBarSize,
	type SearchBarVariant,
} from "@delacour/react-native-ui/search-bar";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes, shapes and variants",
	caption:
		"Input's three sizes and two variants, as a pill or with the field's own corner. The box is the same one a plain `Input` draws.",
	align: "stretch",
};

const SIZE_LABELS: Record<SearchBarSize, string> = { sm: "Small", md: "Medium", lg: "Large" };
const SHAPE_LABELS: Record<SearchBarShape, string> = { pill: "pill", rounded: "rounded" };
const VARIANT_LABELS: Record<SearchBarVariant, string> = { primary: "primary", secondary: "secondary" };

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SEARCH_BAR_SIZES.map((size) => (
				<SearchBar cancel="never" key={size} placeholder={`${SIZE_LABELS[size]}`} size={size} />
			))}
			{SEARCH_BAR_SHAPES.flatMap((shape) =>
				SEARCH_BAR_VARIANTS.map((variant) => (
					<SearchBar
						cancel="never"
						key={`${shape}-${variant}`}
						placeholder={`${SHAPE_LABELS[shape]}, ${VARIANT_LABELS[variant]}`}
						shape={shape}
						variant={variant}
					/>
				))
			)}
		</View>
	);
}
