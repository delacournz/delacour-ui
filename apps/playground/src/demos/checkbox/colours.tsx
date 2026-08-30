import { CHECKBOX_COLORS, Checkbox } from "@delacour/native-ui/checkbox";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "center",
	caption:
		"Ticked and unticked at every colour. An unticked box is chrome at all six — the colour only says what a tick means.",
	capture: { hero: true },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof CHECKBOX_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	danger: "Danger",
	info: "Info",
};

/**
 * One colour, ticked and not, side by side.
 *
 * Built from the exported `as const` array rather than written out, so a colour
 * added to `CHECKBOX_COLORS` appears here with no edit.
 */
function ColorRow({ color }: { color: (typeof CHECKBOX_COLORS)[number] }): ReactElement {
	const [isChecked, setChecked] = useState(true);

	return (
		<View className="flex-row items-center gap-4">
			<Checkbox color={color} isChecked={isChecked} onCheckedChange={setChecked} testID={`checkbox-${color}`}>
				<Checkbox.Label>{LABELS[color]}</Checkbox.Label>
			</Checkbox>
			<Checkbox color={color} defaultChecked={false} />
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{CHECKBOX_COLORS.map((color) => (
				<ColorRow color={color} key={color} />
			))}
		</View>
	);
}
