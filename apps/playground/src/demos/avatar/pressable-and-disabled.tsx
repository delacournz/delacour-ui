import { Avatar } from "@delacour/react-native-ui/avatar";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable and disabled",
	align: "center",
	caption:
		"With `onPress` the avatar becomes a button that scales under the finger. `isDisabled` fades it and blocks the press.",
};

export function Demo(): ReactElement {
	const [presses, setPresses] = useState(0);

	return (
		<View className="items-center gap-3">
			<View className="flex-row items-center gap-4">
				<Avatar
					haptic="light"
					name="Oliver Lee"
					onPress={() => setPresses((count) => count + 1)}
					size="lg"
					source={{ uri: "https://i.pravatar.cc/160?img=12" }}
					testID="avatar-pressable"
				/>
				<Avatar
					isDisabled
					name="Chen Wei"
					onPress={() => setPresses((count) => count + 1)}
					size="lg"
					testID="avatar-disabled"
				/>
			</View>
			<Text.Caption color="muted" testID="press-count">{`Pressed ${presses} times`}</Text.Caption>
		</View>
	);
}
