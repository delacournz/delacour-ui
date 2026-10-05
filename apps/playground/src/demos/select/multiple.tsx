import { Select } from "@delacour/react-native-ui/select";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Multiple",
	caption:
		'`selectionMode="multiple"` keeps the sheet open, draws a box on every row and closes from a Done footer. The trigger joins two labels, then counts. `maxSelected` disables the rest once the limit is reached.',
};

const TOPPINGS = [
	{ label: "Cheese", value: "cheese" },
	{ label: "Mushroom", value: "mushroom" },
	{ label: "Olives", value: "olives" },
	{ label: "Pineapple", value: "pineapple" },
	{ label: "Rocket", value: "rocket" },
	{ label: "Salami", value: "salami" },
] as const;

export function Demo(): ReactElement {
	const [toppings, setToppings] = useState<string[]>(["cheese", "rocket"]);

	return (
		<Select
			maxSelected={3}
			onValueChange={setToppings}
			options={TOPPINGS}
			placeholder="Pick up to three"
			selectionMode="multiple"
			testID="select-multiple"
			title="Toppings"
			value={toppings}
		/>
	);
}
