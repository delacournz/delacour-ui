import { Meter } from "@delacour/react-native-ui/meter";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	note: "A header row holding a label and the formatted reading, over the progress bar's own track and fill. Given low, high and optimum, the reading is judged: here the bottom of the scale is good, so a nearly full disk turns warning.",
	capture: { align: "stretch", hero: true },
};

const GIGABYTES = { maximumFractionDigits: 0, style: "unit", unit: "gigabyte" } as const;

export function Demo(): ReactElement {
	return (
		<Meter formatOptions={GIGABYTES} high={240} low={192} maxValue={256} optimum={0} testID="meter-anatomy" value={212}>
			<Meter.Header>
				<Meter.Label>Storage</Meter.Label>
				<Meter.Output />
			</Meter.Header>
			<Meter.Track>
				<Meter.Fill />
			</Meter.Track>
		</Meter>
	);
}
