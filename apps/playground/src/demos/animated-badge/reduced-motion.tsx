import { AnimatedBadge } from "@delacour/react-native-ui/animated-badge";
import { Button } from "@delacour/react-native-ui/button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Reduced motion",
	align: "center",
	note: "Turn on Reduce Motion in the system settings: the words swap in place, the capsule takes its new width at once, and the loading glyph holds still.",
};

export function Demo(): ReactElement {
	const [isDone, setIsDone] = useState(false);

	return (
		<View className="items-center gap-6">
			<AnimatedBadge status={isDone ? "success" : "loading"}>{isDone ? "Uploaded" : "Uploading"}</AnimatedBadge>
			<Button onPress={() => setIsDone((done) => !done)} size="sm" testID="toggle-upload" variant="secondary">
				Toggle
			</Button>
		</View>
	);
}
