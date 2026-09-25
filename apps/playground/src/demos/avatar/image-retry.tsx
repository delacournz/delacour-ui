import { Avatar } from "@delacour/react-native-ui/avatar";
import { Button } from "@delacour/react-native-ui/button";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A failed image, retried",
	align: "center",
	caption:
		"A failure is remembered for that source only. Swap in a working URL and the avatar tries again on its own; switch back to the dead one and the initials return without it being requested again.",
};

const WORKING = "https://i.pravatar.cc/160?img=32";
const BROKEN = "https://invalid.example/dana.png";

export function Demo(): ReactElement {
	const [uri, setUri] = useState(BROKEN);
	const [errors, setErrors] = useState(0);
	const isBroken = uri === BROKEN;

	return (
		<View className="items-center gap-4">
			<Avatar
				imageProps={{ onError: () => setErrors((count) => count + 1) }}
				name="Dana Kim"
				size="xl"
				source={{ uri }}
				testID="avatar-retry"
			/>
			<Text.Caption color="muted" testID="retry-errors">{`Load errors: ${errors}`}</Text.Caption>
			<Button onPress={() => setUri(isBroken ? WORKING : BROKEN)} size="sm" testID="retry-toggle" variant="secondary">
				{isBroken ? "Use a working URL" : "Break the URL"}
			</Button>
		</View>
	);
}
