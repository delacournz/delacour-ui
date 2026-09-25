import { Meter, type MeterRegion } from "@delacour/react-native-ui/meter";
import { Slider } from "@delacour/react-native-ui/slider";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Low, high and optimum",
	note: "The same three regions read three ways. With optimum below low, the bottom is good — a disk. Above high, the top is — a battery. Between them, the band is good and either side is worse — a room. Drag each reading across its boundaries. A valueLabel function words the region, and because the label is spoken as well as drawn, the judgement never rests on colour alone.",
	capture: { align: "stretch" },
};

type Scenario = {
	id: string;
	label: string;
	minValue: number;
	maxValue: number;
	low: number;
	high: number;
	optimum: number;
	initial: number;
	formatOptions: Intl.NumberFormatOptions;
	words: Record<MeterRegion, string>;
};

const SCENARIOS: readonly Scenario[] = [
	{
		formatOptions: { maximumFractionDigits: 0, style: "percent" },
		high: 90,
		id: "disk",
		initial: 82,
		label: "Disk",
		low: 70,
		maxValue: 100,
		minValue: 0,
		optimum: 0,
		words: { critical: "Full", optimum: "Plenty free", suboptimum: "Filling up" },
	},
	{
		formatOptions: { maximumFractionDigits: 0, style: "percent" },
		high: 50,
		id: "battery",
		initial: 14,
		label: "Battery",
		low: 20,
		maxValue: 100,
		minValue: 0,
		optimum: 100,
		words: { critical: "Charge now", optimum: "Charged", suboptimum: "Getting low" },
	},
	{
		formatOptions: { maximumFractionDigits: 0, style: "unit", unit: "celsius" },
		high: 24,
		id: "room",
		initial: 21,
		label: "Living room",
		low: 18,
		maxValue: 35,
		minValue: 5,
		optimum: 21,
		words: { critical: "Uncomfortable", optimum: "Comfortable", suboptimum: "Uncomfortable" },
	},
];

function ScenarioRow({ scenario }: { scenario: Scenario }): ReactElement {
	const [value, setValue] = useState(scenario.initial);

	return (
		<View className="gap-3">
			<Meter
				formatOptions={scenario.formatOptions}
				high={scenario.high}
				low={scenario.low}
				maxValue={scenario.maxValue}
				minValue={scenario.minValue}
				optimum={scenario.optimum}
				testID={`meter-region-${scenario.id}`}
				value={value}
				valueLabel={({ formatted, region }) =>
					region === null ? formatted : `${scenario.words[region]} · ${formatted}`
				}
			>
				<Meter.Header>
					<Meter.Label>{scenario.label}</Meter.Label>
					<Meter.Output testID={`meter-region-${scenario.id}-output`} />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
			<Slider
				maxValue={scenario.maxValue}
				minValue={scenario.minValue}
				onChange={(next) => setValue(typeof next === "number" ? next : (next[0] ?? scenario.minValue))}
				size="sm"
				value={value}
			>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb accessibilityLabel={`${scenario.label} reading`} testID={`meter-region-${scenario.id}-thumb`} />
				</Slider.Track>
			</Slider>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{SCENARIOS.map((scenario) => (
				<ScenarioRow key={scenario.id} scenario={scenario} />
			))}
		</View>
	);
}
