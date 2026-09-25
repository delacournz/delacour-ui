import { CHIP_COLORS, CHIP_VARIANTS, Chip, type ChipColor } from "@delacour/react-native-ui/chip";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants and colours",
	caption:
		"Two resting variants, `soft` and `outline`, in every colour. Each chip is an uncontrolled toggle — tap one to see the solid fill selection paints.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const VARIANT_LABELS: Record<(typeof CHIP_VARIANTS)[number], string> = {
	soft: "Soft",
	outline: "Outline",
};

const COLOR_LABELS: Record<ChipColor, string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

/**
 * Every colour of one variant, on a row that wraps.
 *
 * Built from the exported `as const` arrays, so a colour added to `CHIP_COLORS`
 * appears here with no edit. The last row starts selected, so the matrix shows
 * both ends of the toggle before anything is tapped.
 */
function ChipRow({
	variant,
	label,
	defaultSelected,
}: {
	variant: (typeof CHIP_VARIANTS)[number];
	label: string;
	defaultSelected: boolean;
}): ReactElement {
	return (
		<View className="gap-2">
			<Text.Caption color="muted">{label}</Text.Caption>
			<View className="flex-row flex-wrap gap-2">
				{CHIP_COLORS.map((color) => (
					<Chip
						color={color}
						defaultSelected={defaultSelected}
						key={color}
						testID={`${label.toLowerCase()}-${color}`}
						variant={variant}
					>
						{COLOR_LABELS[color]}
					</Chip>
				))}
			</View>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{CHIP_VARIANTS.map((variant) => (
				<ChipRow defaultSelected={false} key={variant} label={VARIANT_LABELS[variant]} variant={variant} />
			))}
			<ChipRow defaultSelected label="Selected" variant="soft" />
		</View>
	);
}
