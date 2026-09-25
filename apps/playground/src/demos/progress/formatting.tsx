import { Progress } from "@delacour/react-native-ui/progress";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Formatting",
	note: "Any range, any format. formatOptions goes to Intl.NumberFormat, a function child words the readout itself, and valueLabel replaces it on screen and to the screen reader at once. A range other than 0–100 is spoken as a count — “18 of 24” — rather than as a percentage.",
	capture: { align: "stretch" },
};

const CURRENCY = { currency: "NZD", maximumFractionDigits: 0, style: "currency" } as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<Progress color="warning" formatOptions={CURRENCY} maxValue={2000} testID="progress-budget" value={1250}>
				<Progress.Header>
					<Progress.Label>Budget</Progress.Label>
					<Progress.Output />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
			<Progress color="success" maxValue={24} testID="progress-seats" value={18}>
				<Progress.Header>
					<Progress.Label>Seats sold</Progress.Label>
					<Progress.Output>{({ value, maxValue }) => `${value} of ${maxValue}`}</Progress.Output>
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
			<Progress maxValue={5} minValue={1} testID="progress-steps" value={3} valueLabel="Step 3 of 5">
				<Progress.Header>
					<Progress.Label>Onboarding</Progress.Label>
					<Progress.Output />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
		</View>
	);
}
