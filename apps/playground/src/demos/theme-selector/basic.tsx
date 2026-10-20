import { ThemeSelector } from "@delacour/react-native-ui/theme-selector";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Reads the live theme — System while the app follows the device — and applies a press through `Uniwind.setTheme`. Change the theme anywhere else and it follows.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return <ThemeSelector testID="theme-selector-basic" />;
}
