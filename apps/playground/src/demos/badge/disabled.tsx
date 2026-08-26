import { BADGE_VARIANTS, Badge } from "@delacour/native-ui/badge";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled",
};

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{BADGE_VARIANTS.map((variant) => (
					<Badge
						color="danger"
						isDisabled
						key={variant}
						onPress={bump}
						testID={`disabled-${variant}`}
						variant={variant}
					>
						{variant}
					</Badge>
				))}
			</View>
			<Text.Caption>{`Pressed ${pressCount}`}</Text.Caption>
		</View>
	);
}
