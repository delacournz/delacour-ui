import { Combobox } from "@delacour/react-native-ui/combobox";
import { IconGlobe, IconLocation } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Groups and descriptions",
	caption:
		"`Combobox.Group` and `Combobox.Item` declare the same options the `options` prop takes. A group the query empties disappears with its heading; descriptions and icons ride along, and a disabled option stays in the results.",
};

export function Demo(): ReactElement {
	const [zone, setZone] = useState<string | null>(null);

	return (
		<Combobox onValueChange={setZone} placeholder="Time zone" testID="combobox-grouped" title="Time zone" value={zone}>
			<Combobox.Group label="Pacific">
				<Combobox.Item
					description="UTC+13 in summer"
					icon={IconLocation}
					keywords={["NZDT", "NZST"]}
					label="Auckland"
					value="Pacific/Auckland"
				/>
				<Combobox.Item description="UTC+13 in summer" label="Chatham Islands" value="Pacific/Chatham" />
				<Combobox.Item description="UTC+12" label="Fiji" value="Pacific/Fiji" />
				<Combobox.Item description="UTC−10" label="Honolulu" value="Pacific/Honolulu" />
			</Combobox.Group>
			<Combobox.Group label="Europe">
				<Combobox.Item
					description="UTC+0"
					icon={IconGlobe}
					keywords={["GMT", "BST"]}
					label="London"
					value="Europe/London"
				/>
				<Combobox.Item description="UTC+1" label="Paris" value="Europe/Paris" />
				<Combobox.Item description="Not available in your plan" isDisabled label="Zürich" value="Europe/Zurich" />
			</Combobox.Group>
		</Combobox>
	);
}
