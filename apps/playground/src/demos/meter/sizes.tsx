import { METER_SIZES, Meter } from "@delacour/react-native-ui/meter";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The size is the track's thickness and the header's type step — the progress bar's — and a block is exactly as thick as the continuous track beside it.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof METER_SIZES)[number], string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{METER_SIZES.map((size) => (
				<View className="gap-3" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Meter accessibilityLabel={`${LABELS[size]} meter`} color="primary" size={size} value={62} />
					<Meter
						accessibilityLabel={`${LABELS[size]} segmented meter`}
						color="primary"
						segments={5}
						size={size}
						testID={`meter-segments-${size}`}
						value={62}
					/>
				</View>
			))}
		</View>
	);
}
