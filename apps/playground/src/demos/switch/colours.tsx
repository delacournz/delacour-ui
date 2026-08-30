import { SWITCH_COLORS, Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "center",
	caption:
		"On and off at every colour. An off switch is the same chrome at all six — the colour only says what being on means. Both the track and the knob fade between two token values off the thumb's own travel.",
	capture: {},
};

/**
 * One colour, on and off, side by side.
 *
 * Built from the exported `as const` array rather than written out, so a colour
 * added to `SWITCH_COLORS` appears here with no edit.
 */
function ColorRow({ color }: { color: (typeof SWITCH_COLORS)[number] }): ReactElement {
	const [isSelected, setSelected] = useState(true);

	return (
		<View className="flex-row items-center gap-4">
			<Switch color={color} isSelected={isSelected} onSelectedChange={setSelected} />
			<Switch color={color} defaultSelected={false} />
			<Text.Caption>{color}</Text.Caption>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{SWITCH_COLORS.map((color) => (
				<ColorRow color={color} key={color} />
			))}
		</View>
	);
}
