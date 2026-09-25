import { METER_COLORS, Meter } from "@delacour/react-native-ui/meter";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	note: "On a plain scale — no regions, no thresholds — the color prop paints the fill. The set is the progress bar's, so a meter and a bar in one card name a colour with the same word.",
	align: "stretch",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof METER_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

const VALUES: Record<(typeof METER_COLORS)[number], number> = {
	default: 58,
	primary: 72,
	success: 91,
	warning: 64,
	destructive: 23,
	info: 40,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			{METER_COLORS.map((color) => (
				<Meter color={color} key={color} testID={`meter-${color}`} value={VALUES[color]}>
					<Meter.Header>
						<Meter.Label>{LABELS[color]}</Meter.Label>
						<Meter.Output />
					</Meter.Header>
					<Meter.Track>
						<Meter.Fill />
					</Meter.Track>
				</Meter>
			))}
		</View>
	);
}
