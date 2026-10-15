import { Compare, type ComparePosition } from "@delacour/react-native-ui/compare";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Snap points",
	caption:
		"`snapPoints` are stops a release lands on when it is within `snapThreshold` of one. Snapping waits for the release — a seam that snapped mid-drag would feel sticky — and the haptic ticks as the seam arrives at a stop, never per frame.",
	capture: { align: "stretch", flow: "compare/snap-points" },
};

const SNAP_POINTS = [0, 0.5, 1] as const;

export function Demo(): ReactElement {
	const [settled, setSettled] = useState<ComparePosition>(0.5);

	return (
		<View className="gap-3">
			<Compare
				accessibilityLabel="Contrast"
				className="aspect-video"
				color="primary"
				onPositionChangeEnd={setSettled}
				snapPoints={SNAP_POINTS}
				snapThreshold={0.08}
			>
				<Compare.Before>
					<View className="flex-1 bg-muted" />
				</Compare.Before>
				<Compare.After>
					<View className="flex-1 bg-primary" />
				</Compare.After>
				<Compare.Handle testID="compare-snap-handle" />
			</Compare>
			<Text.Caption color="muted" testID="compare-snap-readout">
				{`Settled at ${Math.round(settled * 100)}%`}
			</Text.Caption>
		</View>
	);
}
