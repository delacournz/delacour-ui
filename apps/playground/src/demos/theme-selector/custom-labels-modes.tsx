import { ThemeSelector } from "@delacour/react-native-ui/theme-selector";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom labels and modes",
	caption:
		"`modes` picks the options and their order; `labels` renames them, for localisation. Without System, a device-following app shows its resolved theme.",
};

export function Demo(): ReactElement {
	return <ThemeSelector labels={{ dark: "Night", light: "Day" }} modes={["light", "dark"]} />;
}
