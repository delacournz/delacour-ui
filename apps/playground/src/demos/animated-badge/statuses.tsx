import {
	ANIMATED_BADGE_STATUSES,
	AnimatedBadge,
	type AnimatedBadgeStatus,
} from "@delacour/react-native-ui/animated-badge";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Statuses",
	align: "center",
	note: "Each status picks its colour and its glyph. Loading spins and gently swells.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<AnimatedBadgeStatus, string> = {
	neutral: "Queued",
	info: "Syncing",
	success: "Live",
	warning: "Degraded",
	destructive: "Failed",
	loading: "Building",
};

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap items-center justify-center gap-2">
			{ANIMATED_BADGE_STATUSES.map((status) => (
				<AnimatedBadge announce={false} key={status} status={status}>
					{LABELS[status]}
				</AnimatedBadge>
			))}
		</View>
	);
}
