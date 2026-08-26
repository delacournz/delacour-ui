import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Explicit values",
	caption:
		"`pressedScale` and `pressedOpacity` cover what the named modes do not, and each wins on the axis it names. 1 is the neutral value on either.",
	capture: { align: "stretch" },
};

const PRESS_STYLES = [
	{ label: "scale only", pressedOpacity: 1, pressedScale: 0.94 },
	{ label: "fade only", pressedOpacity: 0.5, pressedScale: 1 },
	{ label: "both", pressedOpacity: 0.7, pressedScale: 0.97 },
	{ label: "neither", pressedOpacity: 1, pressedScale: 1 },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{PRESS_STYLES.map((style) => (
				<Pressable
					className="rounded-xl border border-border bg-card p-4"
					key={style.label}
					pressedOpacity={style.pressedOpacity}
					pressedScale={style.pressedScale}
					testID={`style-${style.label}`}
				>
					<Text className="font-semibold text-card-foreground text-base">{style.label}</Text>
					<Text.Caption>
						scale {style.pressedScale}, opacity {style.pressedOpacity}
					</Text.Caption>
				</Pressable>
			))}
		</View>
	);
}
