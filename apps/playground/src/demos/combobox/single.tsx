import { Combobox } from "@delacour/react-native-ui/combobox";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single",
	caption:
		"The sheet opens with its search field focused and the rows filter as you type — case- and accent-insensitive, on the label and on `keywords`, with the match in bold. A pick closes the sheet and the trigger reads the choice.",
	capture: { flow: "combobox/single", frame: "device", hero: true },
};

const COUNTRIES = [
	{ keywords: ["AU"], label: "Australia", value: "au" },
	{ keywords: ["CA"], label: "Canada", value: "ca" },
	{ keywords: ["FJ"], label: "Fiji", value: "fj" },
	{ keywords: ["DE", "Germany"], label: "Deutschland", value: "de" },
	{ keywords: ["IE"], label: "Ireland", value: "ie" },
	{ keywords: ["JP"], label: "Japan", value: "jp" },
	{ keywords: ["NZ", "Aotearoa"], label: "New Zealand", value: "nz" },
	{ keywords: ["AT", "Austria"], label: "Österreich", value: "at" },
	{ keywords: ["WS"], label: "Samoa", value: "ws" },
	{ keywords: ["TO"], label: "Tonga", value: "to" },
	{ keywords: ["GB", "UK", "Britain"], label: "United Kingdom", value: "gb" },
	{ keywords: ["US", "USA", "America"], label: "United States", value: "us" },
] as const;

/**
 * The root fills and centres because this demo is captured as a whole screen:
 * the capture stage hands a `device` demo the full window with no gutter, and
 * the sheet it opens needs the screen to rise over.
 */
export function Demo(): ReactElement {
	const [country, setCountry] = useState<string | null>(null);

	return (
		<View className="flex-1 justify-center px-screen-gutter">
			<Combobox
				isClearable
				onValueChange={setCountry}
				options={COUNTRIES}
				placeholder="Choose a country"
				testID="combobox-single"
				title="Country"
				value={country}
			/>
		</View>
	);
}
