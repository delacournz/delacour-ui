import { BADGE_COLORS, BADGE_VARIANTS, Badge } from "@delacour/native-ui/badge";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants and colours",
	capture: { align: "stretch", hero: true },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof BADGE_VARIANTS)[number], string> = {
	solid: "Solid",
	soft: "Soft",
	outline: "Outline",
	ghost: "Ghost",
};

/**
 * Every colour of one variant, on a row that wraps.
 *
 * The grid is built from the exported `as const` arrays rather than written out,
 * so a colour added to `BADGE_COLORS` appears here with no edit.
 */
function VariantRow({ variant }: { variant: (typeof BADGE_VARIANTS)[number] }): ReactElement {
	return (
		<View className="gap-2">
			<Text.Caption color="muted">{LABELS[variant]}</Text.Caption>
			<View className="flex-row flex-wrap gap-2">
				{BADGE_COLORS.map((color) => (
					<Badge color={color} key={color} variant={variant}>
						{color}
					</Badge>
				))}
			</View>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{BADGE_VARIANTS.map((variant) => (
				<VariantRow key={variant} variant={variant} />
			))}
		</View>
	);
}
