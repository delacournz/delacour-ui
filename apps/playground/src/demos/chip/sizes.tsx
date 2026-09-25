import { Button } from "@delacour/react-native-ui/button";
import { CHIP_SIZES, Chip, type ChipSize } from "@delacour/react-native-ui/chip";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"Padding, never a height — the label grows with the system text size. The glyph and the remove control step up the shared icon scale with the chip.",
	capture: { align: "center" },
};

const LABELS: Record<ChipSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	const [removed, setRemoved] = useState<ReadonlySet<ChipSize>>(new Set());

	return (
		<View className="items-start gap-3">
			{CHIP_SIZES.map((size) => (
				<View className="flex-row flex-wrap gap-2" key={size}>
					<Chip defaultSelected={size === "md"} size={size} testID={`size-${size}`}>
						<Icon icon={IconStar} />
						<Chip.Label>{LABELS[size]}</Chip.Label>
					</Chip>
					{removed.has(size) ? null : (
						<Chip
							closeAccessibilityLabel={`Remove ${LABELS[size]}`}
							onClose={() => setRemoved((current) => new Set(current).add(size))}
							size={size}
							testID={`removable-${size}`}
							variant="outline"
						>
							{LABELS[size]}
						</Chip>
					)}
				</View>
			))}
			{removed.size > 0 ? (
				<Button onPress={() => setRemoved(new Set())} size="sm" testID="reset-sizes" variant="ghost">
					Reset
				</Button>
			) : null}
		</View>
	);
}
