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

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof SWITCH_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	danger: "Danger",
	info: "Info",
};

/**
 * One colour, on and off, side by side.
 *
 * Built from the exported `as const` array, so a colour added to
 * `SWITCH_COLORS` appears here with no edit — and fails the typecheck until it
 * is given a label in `LABELS`, which is the point of keeping that map
 * exhaustive rather than title-casing the value.
 */
function ColorRow({ color }: { color: (typeof SWITCH_COLORS)[number] }): ReactElement {
	const [isSelected, setSelected] = useState(true);

	return (
		<View className="flex-row items-center gap-4">
			<Switch color={color} isSelected={isSelected} onSelectedChange={setSelected} />
			<Switch color={color} defaultSelected={false} />
			<Text.Caption>{LABELS[color]}</Text.Caption>
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
