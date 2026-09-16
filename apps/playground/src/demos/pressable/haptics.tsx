import { type HapticFeedback, Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Haptics",
	align: "center",
	caption: "The haptic fires inside the gesture worklet, so it lands in the same frame as the press.",
	capture: {},
};

/**
 * Written out rather than mapped from the value, so no reader is shown a raw prop.
 *
 * Keyed on `HapticFeedback`, which is the only exhaustive check available here:
 * the library exports the type but no tuple, so a Record is what fails this
 * file's typecheck when a haptic is added rather than letting it go unshown.
 */
const LABELS: Record<HapticFeedback, string> = {
	selection: "Selection",
	light: "Light",
	medium: "Medium",
	heavy: "Heavy",
	success: "Success",
	warning: "Warning",
	error: "Error",
};

/**
 * Reading order, taken from the labels rather than restated beside them.
 *
 * `Object.keys` preserves insertion order for string keys that are not
 * integer-like — the same property `defineDemoGroup` leans on for a demo
 * group's own order — so listing each haptic once is enough to fix both what is
 * shown and the order it is shown in.
 */
const HAPTICS = Object.keys(LABELS) as readonly HapticFeedback[];

export function Demo(): ReactElement {
	return (
		<View className="flex-row flex-wrap justify-center gap-2">
			{HAPTICS.map((haptic) => (
				<Pressable
					className="rounded-lg bg-tertiary px-3 py-2"
					haptic={haptic}
					key={haptic}
					testID={`haptic-${haptic}`}
				>
					<Text className="text-sm text-tertiary-foreground">{LABELS[haptic]}</Text>
				</Pressable>
			))}
		</View>
	);
}
