import { AVATAR_SIZES, Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group sizes and overlap",
	caption:
		"The group sets every face's size. `overlap` is how far each slides under the one before — a third of the edge by default, `0` for a plain row.",
};

const OVERLAPS = ["tight", "default", "row"] as const;
type Overlap = (typeof OVERLAPS)[number];

const OVERLAP_POINTS: Record<Overlap, number | undefined> = {
	tight: 20,
	default: undefined,
	row: 0,
};

const OVERLAP_LABELS: Record<Overlap, string> = {
	tight: "Tight",
	default: "Default",
	row: "Row",
};

const NAMES = ["Kate Austen", "Oliver Lee", "Chen Wei", "Dana Kim", "Ben Okafor"] as const;

export function Demo(): ReactElement {
	const [overlap, setOverlap] = useState<Overlap>("default");

	return (
		<View className="gap-5">
			<View className="flex-row gap-2">
				{OVERLAPS.map((option) => (
					<Button
						accessibilityState={{ selected: option === overlap }}
						key={option}
						onPress={() => setOverlap(option)}
						size="sm"
						testID={`overlap-${option}`}
						variant={option === overlap ? "primary" : "secondary"}
					>
						{OVERLAP_LABELS[option]}
					</Button>
				))}
			</View>
			<View className="items-start gap-4">
				{AVATAR_SIZES.map((size) => (
					<Avatar.Group key={size} max={4} overlap={OVERLAP_POINTS[overlap]} size={size}>
						{NAMES.map((name, index) => (
							<Avatar color={index % 2 === 0 ? "primary" : "info"} key={name} name={name} />
						))}
					</Avatar.Group>
				))}
			</View>
		</View>
	);
}
