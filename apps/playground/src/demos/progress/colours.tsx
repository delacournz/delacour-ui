import { PROGRESS_COLORS, Progress } from "@delacour/react-native-ui/progress";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	note: "The colour paints the fill and never the track, so an empty bar is the same groove at every colour. The set is the slider's, so a bar and a slider in one form name a colour with the same word.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof PROGRESS_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

const VALUES: Record<(typeof PROGRESS_COLORS)[number], number> = {
	default: 64,
	primary: 48,
	success: 100,
	warning: 82,
	destructive: 27,
	info: 55,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{PROGRESS_COLORS.map((color) => (
				<Progress color={color} key={color} testID={`progress-${color}`} value={VALUES[color]}>
					<Progress.Header>
						<Progress.Label>{LABELS[color]}</Progress.Label>
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
