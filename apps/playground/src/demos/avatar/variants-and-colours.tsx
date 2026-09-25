import { AVATAR_COLORS, AVATAR_VARIANTS, Avatar } from "@delacour/react-native-ui/avatar";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants and colours",
	caption: "`variant` and `color` paint the fallback, on the six colours a `Badge` takes.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof AVATAR_VARIANTS)[number], string> = {
	soft: "Soft",
	solid: "Solid",
};

/** One initial per colour, so the row reads as six people rather than one repeated. */
const NAMES: Record<(typeof AVATAR_COLORS)[number], string> = {
	default: "Dee Fault",
	primary: "Pri Mary",
	success: "Sue Cess",
	warning: "Wren Ing",
	destructive: "Des Troy",
	info: "Ivo Info",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{AVATAR_VARIANTS.map((variant) => (
				<View className="gap-2" key={variant}>
					<Text.Caption color="muted">{LABELS[variant]}</Text.Caption>
					<View className="flex-row flex-wrap gap-2">
						{AVATAR_COLORS.map((color) => (
							<Avatar color={color} key={color} name={NAMES[color]} variant={variant} />
						))}
					</View>
				</View>
			))}
		</View>
	);
}
