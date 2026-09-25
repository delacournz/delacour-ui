import { CHIP_SIZES, Chip, type ChipSize } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"Padding, never a height — the label grows with the system text size. The glyph steps up the shared icon scale with the chip.",
	capture: { align: "center" },
};

const LABELS: Record<ChipSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="items-start gap-3">
			{CHIP_SIZES.map((size) => (
				<View className="flex-row flex-wrap gap-2" key={size}>
					<Chip defaultSelected={size === "md"} size={size} testID={`size-${size}`}>
						<Icon icon={IconStar} />
						<Chip.Label>{LABELS[size]}</Chip.Label>
					</Chip>
					<Chip onClose={() => {}} size={size} variant="outline">
						{LABELS[size]}
					</Chip>
				</View>
			))}
		</View>
	);
}
