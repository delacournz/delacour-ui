import { Progress } from "@delacour/react-native-ui/progress";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	note: "A header row holding a label and the formatted value, over a track holding the fill. The label is the bar's accessible name; the readout is hidden from screen readers because the root already speaks the value.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<Progress testID="progress-anatomy" value={72}>
			<Progress.Header>
				<Progress.Label>Storage</Progress.Label>
				<Progress.Output />
			</Progress.Header>
			<Progress.Track>
				<Progress.Fill />
			</Progress.Track>
		</Progress>
	);
}
