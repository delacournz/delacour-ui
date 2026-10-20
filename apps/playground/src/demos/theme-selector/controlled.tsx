import { Text } from "@delacour/react-native-ui/text";
import { type ThemeMode, ThemeSelector } from "@delacour/react-native-ui/theme-selector";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	caption:
		"`value` with `onValueChange` puts the choice in your hands, and `applyTheme={false}` keeps a press from re-theming the app — the selector only reports.",
	capture: { align: "stretch", flow: true, hero: true },
};

export function Demo(): ReactElement {
	const [mode, setMode] = useState<ThemeMode>("system");

	return (
		<View className="items-center gap-4">
			<ThemeSelector applyTheme={false} onValueChange={setMode} testID="theme-selector-controlled" value={mode} />
			<Text.Code>{`value: ${mode}`}</Text.Code>
		</View>
	);
}
