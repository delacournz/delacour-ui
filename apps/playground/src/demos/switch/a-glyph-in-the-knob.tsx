import { Icon } from "@delacour/native-ui/icon";
import { IconMoon, IconSun } from "@delacour/native-ui/icons/central";
import { Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A glyph in the knob",
	caption:
		"`Switch.Thumb` is composed in when the children hold none, so write it out only to fill or restyle it. It is drawn last however the children were ordered.",
};

export function Demo(): ReactElement {
	const [dark, setDark] = useState(false);

	return (
		<View className="flex-row items-center gap-4">
			<Switch color="info" isSelected={dark} onSelectedChange={setDark} size="lg" testID="switch-theme">
				<Switch.Thumb>
					<Icon icon={dark ? IconMoon : IconSun} />
				</Switch.Thumb>
			</Switch>
			<Text.Caption>{dark ? "Dark" : "Light"}</Text.Caption>
		</View>
	);
}
