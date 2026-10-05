import { THEME_SELECTOR_SIZES, ThemeSelector, type ThemeSelectorSize } from "@delacour/react-native-ui/theme-selector";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "The button's label steps. `sm` reaches a little past its edges, so it is still a 44pt target.",
};

const LABELS: Record<ThemeSelectorSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{THEME_SELECTOR_SIZES.map((size) => (
				<ThemeSelector accessibilityLabel={`Theme, ${LABELS[size]}`} key={size} size={size} />
			))}
		</View>
	);
}
