import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Long press",
};

export function Demo(): ReactElement {
	const [lastEvent, setLastEvent] = useState("none yet");

	return (
		<Pressable
			className="rounded-xl border border-border bg-card p-4"
			haptic="medium"
			onLongPress={() => setLastEvent("long press")}
			onPress={() => setLastEvent("press")}
			testID="hold-target"
		>
			<Text className="font-semibold text-card-foreground text-base">Press or hold</Text>
			<Text.Caption>Last event: {lastEvent}</Text.Caption>
		</Pressable>
	);
}
