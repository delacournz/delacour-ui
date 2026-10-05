import { Select, type SelectOption } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Data-driven",
	caption:
		"The `options` prop takes the same shape as the children. Two hundred rows scroll in a virtualised list inside the sheet, so a long list costs what is on screen.",
};

const NUMBERS: SelectOption[] = Array.from({ length: 200 }, (_, index) => ({
	label: `Option ${index + 1}`,
	value: String(index + 1),
}));

export function Demo(): ReactElement {
	const [value, setValue] = useState<string | null>(null);

	return (
		<Select
			isSearchable
			onValueChange={setValue}
			options={NUMBERS}
			placeholder="Pick one of 200"
			testID="select-data"
			title="Two hundred options"
			value={value}
		/>
	);
}
