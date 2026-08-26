import { Badge } from "@delacour/native-ui/badge";
import { Icon } from "@delacour/native-ui/icon";
import { IconHeart } from "@delacour/native-ui/icons/central";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable, and pressable with dismiss",
	note: "A badge with no press handler renders a plain View and mounts no gesture detector at all.",
};

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);
	const [closeCount, setCloseCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);
	const bumpClose = () => setCloseCount((n) => n + 1);

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				<Badge haptic="selection" onPress={bump} testID="tap-me">
					Tap me
				</Badge>
				<Badge color="info" haptic="selection" onPress={bump} testID="tap-or-dismiss" variant="soft">
					<Icon icon={IconHeart} />
					<Badge.Label>Tap or dismiss</Badge.Label>
				</Badge>
				<Badge color="danger" haptic="selection" onClose={bumpClose} onPress={bump} testID="both" variant="soft">
					Both
				</Badge>
			</View>
			<Text.Caption>{`Pressed ${pressCount} · dismissed ${closeCount}`}</Text.Caption>
		</View>
	);
}
