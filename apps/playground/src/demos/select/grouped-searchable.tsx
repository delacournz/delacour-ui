import { Select } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Grouped and searchable",
	caption:
		"`Select.Group` puts a heading over a run of options. `isSearchable` adds a field above the rows that matches case- and accent-insensitively, hides a group it empties, and clears when the sheet closes. It is never focused for you — the keyboard would cover the rows.",
	capture: { flow: true, frame: "device" },
};

export function Demo(): ReactElement {
	const [city, setCity] = useState<string | null>(null);

	// The root fills and centres because this demo is captured as a whole screen:
	// a `device` frame hands it the full window with no insets.
	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Select
				isSearchable
				onValueChange={setCity}
				placeholder="Choose a city"
				searchPlaceholder="Search cities"
				testID="select-grouped"
				title="City"
				value={city}
			>
				<Select.Group label="Aotearoa">
					<Select.Item label="Auckland" value="akl" />
					<Select.Item label="Christchurch" value="chc" />
					<Select.Item label="Wellington" value="wlg" />
				</Select.Group>
				<Select.Group label="Australia">
					<Select.Item label="Brisbane" value="bne" />
					<Select.Item label="Melbourne" value="mel" />
					<Select.Item label="Sydney" value="syd" />
				</Select.Group>
				<Select.Group label="Europe">
					<Select.Item label="København" value="cph" />
					<Select.Item label="Malmö" value="mmx" />
					<Select.Item label="Zürich" value="zrh" />
				</Select.Group>
			</Select>
		</View>
	);
}
