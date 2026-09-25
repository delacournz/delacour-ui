import { Meter } from "@delacour/react-native-ui/meter";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Formatting",
	note: "Set maxValue and the meter speaks in what is measured — nothing has to be turned into a percentage on the way in. formatOptions goes to Intl.NumberFormat, valueLabel swaps the number for a word, and a reading off the scale clamps to its end rather than printing more than the maximum.",
};

const GIGABYTES = { maximumFractionDigits: 0, style: "unit", unit: "gigabyte" } as const;
const DOLLARS = { currency: "NZD", maximumFractionDigits: 0, style: "currency" } as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<Meter formatOptions={GIGABYTES} maxValue={256} testID="meter-format-units" value={168}>
				<Meter.Header>
					<Meter.Label>Photos</Meter.Label>
					<Meter.Output />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
			<Meter
				formatOptions={DOLLARS}
				high={1800}
				low={1500}
				maxValue={2000}
				optimum={0}
				testID="meter-format-budget"
				value={2400}
			>
				<Meter.Header>
					<Meter.Label>Budget</Meter.Label>
					<Meter.Output />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
			<Meter color="info" maxValue={10} testID="meter-format-word" value={7} valueLabel="Busy">
				<Meter.Header>
					<Meter.Label>Gym right now</Meter.Label>
					<Meter.Output />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
		</View>
	);
}
