import { Chip } from "@delacour/react-native-ui/chip";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "States",
	caption:
		"A chip with only `onPress` is a button, and a long press is its own handler. `isDisabled` fades the chip and blocks both its press and its remove control.",
};

export function Demo(): ReactElement {
	const [presses, setPresses] = useState(0);
	const [longPresses, setLongPresses] = useState(0);

	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text.Caption color="muted">Button</Text.Caption>
				<View className="flex-row flex-wrap items-center gap-3">
					<Chip
						haptic="light"
						onLongPress={() => setLongPresses((count) => count + 1)}
						onPress={() => setPresses((count) => count + 1)}
						testID="button-chip"
						variant="outline"
					>
						Press or hold
					</Chip>
					<Text.Caption color="muted" testID="button-count">
						{presses} pressed · {longPresses} held
					</Text.Caption>
				</View>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">Disabled</Text.Caption>
				<View className="flex-row flex-wrap gap-2">
					<Chip defaultSelected={false} isDisabled testID="disabled-resting">
						Resting
					</Chip>
					<Chip color="primary" defaultSelected isDisabled testID="disabled-selected">
						Selected
					</Chip>
					<Chip isDisabled onClose={() => {}} testID="disabled-removable" variant="outline">
						Removable
					</Chip>
				</View>
			</View>
		</View>
	);
}
