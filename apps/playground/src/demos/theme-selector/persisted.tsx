import { Text } from "@delacour/react-native-ui/text";
import {
	restoreThemeMode,
	type ThemeMode,
	ThemeSelector,
	useThemeSelection,
} from "@delacour/react-native-ui/theme-selector";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Persisted",
	caption:
		"With `applyTheme={false}` the selector only reports. The app saves the choice, applies it, and shows the saved value — here a stand-in store; in an app, MMKV or AsyncStorage.",
	capture: { align: "stretch" },
};

const storage = new Map<string, string>();

export function Demo(): ReactElement {
	const { setMode } = useThemeSelection();
	const [saved, setSaved] = useState<ThemeMode>(() => restoreThemeMode(storage.get("theme")));

	const choose = (mode: ThemeMode) => {
		storage.set("theme", mode);
		setSaved(mode);
		setMode(mode);
	};

	return (
		<View className="items-center gap-4">
			<ThemeSelector applyTheme={false} onValueChange={choose} testID="theme-selector-persisted" value={saved} />
			<Text.Code>{`saved: ${saved}`}</Text.Code>
		</View>
	);
}
