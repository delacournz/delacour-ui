import { Radio } from "@delacour/native-ui/radio";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Uncontrolled",
	note: "No state at the call site. This is the first exercise useControllableState has had in the package.",
};

export function Demo(): ReactElement {
	return (
		<Radio.Group accessibilityLabel="Shipping speed, uncontrolled" defaultSelected="standard">
			<Radio testID="radio-standard" value="standard">
				Standard
			</Radio>
			<Radio testID="radio-express" value="express">
				Express
			</Radio>
		</Radio.Group>
	);
}
