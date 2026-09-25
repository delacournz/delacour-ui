import { Radio } from "@delacour/react-native-ui/radio";
import { SKELETON_ANIMATIONS, Skeleton, type SkeletonAnimation } from "@delacour/react-native-ui/skeleton";
import type { ReactElement } from "react";
import { useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In step, as a group",
	caption:
		"Every skeleton inside a `Skeleton.Group` reads one clock, so a list shimmers as one sweep instead of a ripple of unrelated glints. The group's `animation` reaches every row.",
	capture: { align: "stretch", flow: "skeleton/group" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<SkeletonAnimation, string> = {
	shimmer: "Shimmer",
	pulse: "Pulse",
	none: "None",
};

const ROWS = ["first", "second", "third", "fourth"] as const;

function isSkeletonAnimation(value: string): value is SkeletonAnimation {
	return (SKELETON_ANIMATIONS as readonly string[]).includes(value);
}

export function Demo(): ReactElement {
	const [animation, setAnimation] = useState<SkeletonAnimation>("shimmer");

	return (
		<View className="gap-6">
			<Radio.Group
				accessibilityLabel="Animation"
				onSelected={(value) => {
					if (isSkeletonAnimation(value)) setAnimation(value);
				}}
				orientation="horizontal"
				selected={animation}
			>
				{SKELETON_ANIMATIONS.map((value) => (
					<Radio key={value} testID={`skeleton-group-${value}`} value={value}>
						{LABELS[value]}
					</Radio>
				))}
			</Radio.Group>
			<Skeleton.Group animation={animation} className="gap-4" label="Loading messages">
				{ROWS.map((row) => (
					<View className="flex-row items-center gap-3" key={row}>
						<Skeleton shape="circle" />
						<Skeleton.Lines className="flex-1" lines={2} />
					</View>
				))}
			</Skeleton.Group>
		</View>
	);
}
