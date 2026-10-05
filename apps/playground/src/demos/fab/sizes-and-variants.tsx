import { FAB_SIZES, FAB_VARIANTS, Fab, type FabSize, type FabVariant } from "@delacour/react-native-ui/fab";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconPlusLarge } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"Without `placement` a fab sits in flow like any other view. Rows are the variants, columns the sizes — 44, 56 and 64pt, from their own tokens rather than the button's.",
	align: "center",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const SIZE_LABELS: Record<FabSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

const VARIANT_LABELS: Record<FabVariant, string> = {
	primary: "Primary",
	secondary: "Secondary",
	surface: "Surface",
	destructive: "Destructive",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{FAB_VARIANTS.map((variant) => (
				<View className="flex-row items-center gap-4" key={variant}>
					{FAB_SIZES.map((size) => (
						<Fab
							accessibilityLabel={`${VARIANT_LABELS[variant]} ${SIZE_LABELS[size]}`}
							key={size}
							size={size}
							testID={`fab-${variant}-${size}`}
							variant={variant}
						>
							<Icon icon={IconPlusLarge} />
						</Fab>
					))}
				</View>
			))}
		</View>
	);
}
