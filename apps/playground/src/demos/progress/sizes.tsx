import { PROGRESS_SIZES, Progress } from "@delacour/react-native-ui/progress";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	note: "The size is the track's thickness and the header's type step, and nothing else — there is no thumb to keep flush and no touch target to pad.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof PROGRESS_SIZES)[number], string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{PROGRESS_SIZES.map((size) => (
				<Progress color="primary" key={size} size={size} testID={`progress-${size}`} value={60}>
					<Progress.Header>
						<Progress.Label>{LABELS[size]}</Progress.Label>
						<Progress.Output />
					</Progress.Header>
					<Progress.Track>
						<Progress.Fill />
					</Progress.Track>
				</Progress>
			))}
		</View>
	);
}
