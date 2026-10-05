import { ThemeSelector } from "@delacour/react-native-ui/theme-selector";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Cards",
	caption: '`variant="cards"` stands the options apart as tiles, a larger glyph over each label.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return <ThemeSelector testID="theme-selector-cards" variant="cards" />;
}
