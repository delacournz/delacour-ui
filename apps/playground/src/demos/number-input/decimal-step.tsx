import { NumberInput } from "@delacour/react-native-ui/number-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Decimal step",
	caption:
		"A `step` of 0.25 keeps two decimals, so ten taps land on 2.5 exactly, never 2.4999999. A typed 1.3 snaps to the nearest quarter on blur.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return <NumberInput accessibilityLabel="Hours" defaultValue={1.5} max={8} min={0} step={0.25} />;
}
