import { Combobox } from "@delacour/react-native-ui/combobox";
import { Field } from "@delacour/react-native-ui/field";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a Field",
	caption:
		"Inside a `Field` the combobox takes its invalid and disabled state, reads `Field.Label` as its accessible name, sheet title and search label, and opens when the label is tapped.",
};

const AIRPORTS = [
	{ description: "Auckland", label: "AKL", value: "akl" },
	{ description: "Christchurch", label: "CHC", value: "chc" },
	{ description: "Dunedin", label: "DUD", value: "dud" },
	{ description: "Queenstown", label: "ZQN", value: "zqn" },
	{ description: "Wellington", label: "WLG", value: "wlg" },
] as const;

export function Demo(): ReactElement {
	const [airport, setAirport] = useState<string | null>(null);
	const error = airport ? undefined : "Choose where you are flying from.";

	return (
		<Field isInvalid={Boolean(error)}>
			<Field.Label>Departure</Field.Label>
			<Combobox
				onValueChange={setAirport}
				options={AIRPORTS}
				placeholder="Airport"
				testID="combobox-field"
				value={airport}
			/>
			<Field.Description>Search by code.</Field.Description>
			<Field.Error>{error}</Field.Error>
		</Field>
	);
}
